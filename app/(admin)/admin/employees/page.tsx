"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddEmployeeDialog } from "@/components/admin/employees/AddEmployeeDialog";
import { EditEmployeeDialog } from "@/components/admin/employees/EditEmployeeDialog";
import { EmployeesTable } from "@/components/admin/employees/EmployeesTable";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserPlus, Search, Loader2, KeyRound, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  personalNumber: string;
  phone: string;
  status: "aktiv" | "inaktiv";
}

/**
 * Admin Employees List Page
 * Shows all employees with search/filter and ability to add new ones
 * Features:
 * - Client-side search by name/email
 * - Add employee modal with database integration
 * - Click row to navigate to detail page
 */
export default function AdminEmployeesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [resettingEmployeeId, setResettingEmployeeId] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ open: boolean; password: string | null; employee?: Employee | null }>({
    open: false,
    password: null,
    employee: null,
  });
  const [resetError, setResetError] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Load employees from database
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to load employees');
      }
      
      const { data } = await response.json();
      
      // Convert database employees to Employee format
      const employeesList: Employee[] = data.map((emp: any) => ({
        id: emp.id,
        name: emp.full_name || emp.personal_number,
        personalNumber: emp.personal_number || "",
        phone: emp.phone || '',
        status: emp.active ? 'aktiv' : 'inaktiv',
      }));
      
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      (emp.personalNumber || '').toLowerCase().includes(term)
    );
  });

  // Handle editing an employee
  const handleEdit = (employee: Employee) => {
    setEditEmployee(employee);
  };

  // Handle deleting an employee
  const handleDelete = (employee: Employee) => {
    setDeleteEmployee(employee);
  };

  const confirmDelete = async () => {
    if (!deleteEmployee) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/employees/${deleteEmployee.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      // Remove employee from local state
      setEmployees(prev => prev.filter(emp => emp.id !== deleteEmployee.id));
      setDeleteEmployee(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding a new employee
  const handleAddEmployee = async (newEmployee: { name: string; personalNumber: string; phone: string; active: boolean }) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal_number: newEmployee.personalNumber,
          full_name: newEmployee.name,
          phone: newEmployee.phone,
          active: newEmployee.active,
        }),
      });

      if (!response.ok) {
        let errMsg = 'Failed to create employee';
        try { const j = await response.json(); if (j?.error) errMsg = j.error; } catch {}
        if (response.status === 409) {
          // Personal number already exists
          alert(errMsg || 'Personalnummer bereits vergeben.');
        }
        throw new Error(errMsg);
      }

      const { data } = await response.json();
      
      // Add new employee to local state
      setEmployees(prev => [...prev, {
        id: data.id,
        name: data.full_name,
        personalNumber: data.personal_number || '',
        phone: data.phone || '',
        status: 'aktiv',
      }]);
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error creating employee:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (employee: Employee) => {
    setResetError(null);
    setPasswordCopied(false);
    setResettingEmployeeId(employee.id);
    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: employee.id }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Temporäres Passwort konnte nicht erstellt werden.');
      }

      if (!payload?.tempPassword) {
        throw new Error('Server hat kein temporäres Passwort zurückgegeben.');
      }

      setTempPasswordModal({ open: true, password: payload.tempPassword, employee });
    } catch (error) {
      console.error('[AdminEmployees] reset password error:', error);
      setResetError(error instanceof Error ? error.message : 'Fehler beim Erstellen des temporären Passworts.');
    } finally {
      setResettingEmployeeId(null);
    }
  };

  const handleCopyTempPassword = async () => {
    if (!tempPasswordModal.password) return;
    try {
      await navigator.clipboard.writeText(tempPasswordModal.password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      console.error('[AdminEmployees] clipboard error:', error);
      setResetError('Konnte Passwort nicht in die Zwischenablage kopieren.');
    }
  };

  const handleUpdateEmployee = async (updatedEmployee: { id: string; name: string; phone: string; active: boolean }) => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/employees/${updatedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: updatedEmployee.name,
          phone: updatedEmployee.phone,
          active: updatedEmployee.active,
        }),
      });

      if (!response.ok) {
        let errMsg = 'Fehler beim Aktualisieren des Mitarbeiters';
        try { const j = await response.json(); if (j?.error) errMsg = j.error; } catch {}
        alert(errMsg);
        throw new Error(errMsg);
      }

      const { data } = await response.json();

      setEmployees((prev) => prev.map((emp) => {
        if (emp.id !== updatedEmployee.id) return emp;
        return {
          ...emp,
          name: data?.full_name ?? updatedEmployee.name,
          phone: data?.phone ?? updatedEmployee.phone ?? '',
          status: data?.active ? 'aktiv' : 'inaktiv',
        };
      }));

      setEditEmployee(null);
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mitarbeiter"
        button={
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span className="text-sm font-medium">Mitarbeiter anlegen</span>
          </button>
        }
      />

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Mitarbeiter suchen"
          />
        </div>
      </div>

      {/* Employee count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
        {searchTerm && ` (gefiltert von ${employees.length})`}
      </div>

      {/* Employee table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Lade Mitarbeiter...</span>
        </div>
      ) : filteredEmployees.length > 0 ? (
        <EmployeesTable
          employees={filteredEmployees}
          onRowClick={(employee) => router.push(`/admin/employees/${employee.id}`)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
          resettingEmployeeId={resettingEmployeeId}
        />
      ) : (
        <div className="border border-border rounded-lg">
          <EmptyState message="Keine Mitarbeiter gefunden" />
        </div>
      )}

      {resetError && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {resetError}
        </div>
      )}

      {/* Add Employee Dialog */}
      <AddEmployeeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleAddEmployee as any}
        isLoading={isSaving}
      />

      <EditEmployeeDialog
        open={!!editEmployee}
        employee={editEmployee}
        onOpenChange={(open) => {
          if (!open) {
            setEditEmployee(null);
          }
        }}
        onSave={handleUpdateEmployee}
        isLoading={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteEmployee}
        onOpenChange={(open) => !open && setDeleteEmployee(null)}
        title="Mitarbeiter löschen"
        description={`Möchten Sie "${deleteEmployee?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteEmployee(null)}
      />

      {tempPasswordModal.open && tempPasswordModal.password && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-2 text-brand">
              <KeyRound className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-foreground">
                Temporäres Passwort für {tempPasswordModal.employee?.name ?? 'Mitarbeiter'}
              </h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Dieses Passwort einmalig sicher an den Mitarbeiter weitergeben. Beim nächsten Login sollte es sofort geändert werden.
            </p>
            <div className="mb-4 rounded-md border border-dashed border-brand bg-brand/5 p-4 text-center">
              <span className="break-all font-mono text-lg font-semibold text-brand">
                {tempPasswordModal.password}
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleCopyTempPassword}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
              >
                {passwordCopied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {passwordCopied ? 'Kopiert' : 'In Zwischenablage kopieren'}
              </button>
              <button
                onClick={() => setTempPasswordModal({ open: false, password: null, employee: null })}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
