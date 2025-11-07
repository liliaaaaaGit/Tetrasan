"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddEmployeeDialog } from "@/components/admin/employees/AddEmployeeDialog";
import { EditEmployeeDialog } from "@/components/admin/employees/EditEmployeeDialog";
import { EmployeesTable } from "@/components/admin/employees/EmployeesTable";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserPlus, Search, Loader2 } from "lucide-react";
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
        />
      ) : (
        <div className="border border-border rounded-lg">
          <EmptyState message="Keine Mitarbeiter gefunden" />
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
    </div>
  );
}
