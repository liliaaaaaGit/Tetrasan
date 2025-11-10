import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { VacationRequestPDF } from "@/components/pdf/VacationRequestPDF";
import { DayOffRequestPDF } from "@/components/pdf/DayOffRequestPDF";
import React from "react";


/**
 * API Route for Downloading Leave Request PDFs
 * GET /api/pdf/[id]
 * Generates and streams PDF for vacation or day-off requests
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
      );
    }

    // Fetch leave request
    const { data: leaveRequest, error: reqError } = await supabase
      .from('leave_requests')
      .select('id, type, employee_id, period_start, period_end, comment, created_at')
      .eq('id', params.id)
      .single();

    if (reqError || !leaveRequest) {
      return NextResponse.json(
        { error: "Antrag nicht gefunden." },
        { status: 404 }
      );
    }

    // Check access: employee can only access their own requests, admin can access any
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = leaveRequest.employee_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 403 }
      );
    }

    // Fetch employee profile for name
    const { data: employee } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', leaveRequest.employee_id)
      .single();

    const employeeName = employee?.full_name || "Unbekannt";

    // Format dates
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    // Generate PDF based on request type
    let pdfDocument: React.ReactElement;
    let fileName: string;

    if (leaveRequest.type === 'vacation') {
      pdfDocument = React.createElement(VacationRequestPDF, {
        employeeName,
        dateRequest: formatDate(leaveRequest.created_at),
        dateFrom: formatDate(leaveRequest.period_start),
        dateTo: formatDate(leaveRequest.period_end),
        reason: leaveRequest.comment || "",
      });
      fileName = `Urlaubsantrag_${employeeName.replace(/\s+/g, '_')}.pdf`;
    } else {
      // Day-off request
      const defaultTimeFrom = "08:00";
      const defaultTimeTo = "17:00";

      let timeFrom = defaultTimeFrom;
      let timeTo = defaultTimeTo;
      let reasonText = leaveRequest.comment || "";

      // Try to extract an inline time range from the comment, e.g. "(Zeit: 15:00 - 18:00)"
      const timePattern = /\(Zeit:\s*([0-2]?\d:[0-5]\d)\s*[-–]\s*([0-2]?\d:[0-5]\d)\s*\)/i;
      const timeMatch = reasonText.match(timePattern);

      if (timeMatch) {
        timeFrom = timeMatch[1];
        timeTo = timeMatch[2];
        // Remove the time annotation from the comment for the PDF output
        reasonText = reasonText.replace(timeMatch[0], "").trim();
        // Collapse any duplicated whitespace after removal
        reasonText = reasonText.replace(/\s{2,}/g, " ").trim();
        if (!reasonText) {
          reasonText = "—";
        }
      }

      pdfDocument = React.createElement(DayOffRequestPDF, {
        employeeName,
        date: formatDate(leaveRequest.period_start),
        timeFrom,
        timeTo,
        reason: reasonText,
      });
      fileName = `Tagesbefreiung_${employeeName.replace(/\s+/g, '_')}.pdf`;
    }

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(pdfDocument);

    // Return PDF as download
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[PDF] Error generating PDF:', error);
    return NextResponse.json(
      { error: "Fehler beim Generieren des PDFs." },
      { status: 500 }
    );
  }
}

