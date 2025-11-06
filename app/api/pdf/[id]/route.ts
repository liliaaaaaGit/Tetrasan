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

    const formatTime = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
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
      // For day-off, time_from and time_to might not be in the database
      // We'll use a default time range or extract from period_start if it's a datetime
      const dateObj = new Date(leaveRequest.period_start);
      const timeFrom = dateObj.getHours() > 0 || dateObj.getMinutes() > 0
        ? formatTime(leaveRequest.period_start)
        : "08:00"; // Default if no time specified
      const timeTo = dateObj.getHours() > 0 || dateObj.getMinutes() > 0
        ? formatTime(leaveRequest.period_end)
        : "17:00"; // Default if no time specified

      pdfDocument = React.createElement(DayOffRequestPDF, {
        employeeName,
        date: formatDate(leaveRequest.period_start),
        timeFrom,
        timeTo,
        reason: leaveRequest.comment || "",
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

