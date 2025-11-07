"use client";

import { useEffect, useState } from "react";
import { X, Pencil } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  personalNumber: string;
  phone: string;
  status: "aktiv" | "inaktiv";
}

interface EditEmployeeDialogProps {
  open: boolean;
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
  onSave: (employee: { id: string; name: string; phone: string; active: boolean }) => void;
  isLoading?: boolean;
}

/**
 * EditEmployeeDialog Component
 * Modal for editing employee master data (name, phone, status)
 */
export function EditEmployeeDialog({
  open,
  employee,
  onOpenChange,
  onSave,
  isLoading = false,
}: EditEmployeeDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee && open) {
      setName(employee.name || "");
      setPhone(employee.phone || "");
      setIsActive(employee.status === "aktiv");
      setError(null);
    }
  }, [employee, open]);

  if (!open || !employee) return null;

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Name ist erforderlich");
      return;
    }

    onSave({
      id: employee.id,
      name: name.trim(),
      phone: phone.trim(),
      active: isActive,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Mitarbeiter bearbeiten</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium mb-1">
                Name *
              </label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  error ? "border-red-500" : "border-border"
                }`}
                placeholder="Max Mustermann"
              />
              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </div>

            {/* Personal number (read-only) */}
            <div>
              <label className="block text-sm font-medium mb-1">Personalnummer</label>
              <input
                type="text"
                value={employee.personalNumber}
                readOnly
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 text-muted-foreground"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="edit-phone" className="block text-sm font-medium mb-1">
                Telefon
              </label>
              <input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0151 12345678"
              />
            </div>

            {/* Active checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-brand focus:ring-2 focus:ring-brand rounded"
              />
              <label htmlFor="edit-active" className="text-sm font-medium">
                Aktiv
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-md hover:bg-secondary/80"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


