"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MoreVertical, Edit, Trash2, KeyRound, Loader2 } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  personalNumber: string;
  phone: string;
  status: "aktiv" | "inaktiv";
}

interface EmployeesTableProps {
  employees: Employee[];
  onRowClick: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onResetPassword?: (employee: Employee) => void;
  resettingEmployeeId?: string | null;
}

/**
 * EmployeesTable Component
 * Displays a table of employees with status badges
 * Mobile-friendly with horizontal scrolling
 */
export function EmployeesTable({
  employees,
  onRowClick,
  onEdit,
  onDelete,
  onResetPassword,
  resettingEmployeeId,
}: EmployeesTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleMenuClick = (e: React.MouseEvent, employeeId: string) => {
    e.stopPropagation(); // Prevent row click
    setOpenMenuId(openMenuId === employeeId ? null : employeeId);
  };

  const handleEdit = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onEdit?.(employee);
  };

  const handleDelete = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onDelete?.(employee);
  };

  const handleReset = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onResetPassword?.(employee);
  };

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-black">
              Name
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-black">
              Personalnummer
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-black hidden md:table-cell">
              Telefon
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-black">
              Status
            </th>
            <th className="text-right px-4 py-3 text-sm font-medium text-black w-12">
              {/* Actions column header */}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {employees.map((employee) => (
            <tr
              key={employee.id}
              onClick={() => onRowClick(employee)}
              className={cn(
                "hover:bg-muted/30 transition-colors cursor-pointer"
              )}
            >
              <td className="px-4 py-3 text-sm font-medium text-black">
                {employee.name}
              </td>
              <td className="px-4 py-3 text-sm text-black">
                {employee.personalNumber}
              </td>
              <td className="px-4 py-3 text-sm text-black hidden md:table-cell">
                {employee.phone}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={employee.status === "aktiv" ? "default" : "secondary"}
                >
                  {employee.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right relative">
                <div className="relative inline-block">
                  <button
                    onClick={(e) => handleMenuClick(e, employee.id)}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                    aria-label="Mehr Optionen"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {openMenuId === employee.id && (
                    <div
                      ref={(el) => {
                        menuRefs.current[employee.id] = el;
                      }}
                      className="absolute right-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-10 py-1"
                    >
                      {onResetPassword && (
                        <button
                          onClick={(e) => handleReset(e, employee)}
                          disabled={resettingEmployeeId === employee.id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-muted transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {resettingEmployeeId === employee.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                          <span>Temporäres Passwort</span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={(e) => handleEdit(e, employee)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-muted transition-colors text-left"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Bearbeiten</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => handleDelete(e, employee)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Löschen</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

