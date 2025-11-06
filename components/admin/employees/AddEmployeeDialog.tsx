"use client";

import React, { useState } from "react";
import { X, UserPlus } from "lucide-react";

interface NewEmployeeInput {
  name: string;
  personalNumber: string; // 5-stellig
  phone: string;
  active: boolean;
}

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (employee: NewEmployeeInput) => void;
  isLoading?: boolean;
}

/**
 * AddEmployeeDialog Component
 * Modal for adding a new employee (UI-only, no backend)
 * Validates name and email are non-empty
 */
export function AddEmployeeDialog({
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: AddEmployeeDialogProps) {
  const [name, setName] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; personalNumber?: string }>({});

  if (!open) return null;

  const handleSave = () => {
    // Simple validation
    const newErrors: { name?: string; personalNumber?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Name ist erforderlich";
    }
    // personal number: exactly 5 digits
    if (!/^\d{5}$/.test(personalNumber)) {
      newErrors.personalNumber = "Personalnummer muss 5-stellig sein";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Create new employee object
    onSave({
      name: name.trim(),
      personalNumber: personalNumber.trim(),
      phone: phone.trim(),
      active: isActive,
    });

    // Reset form
    setName("");
    setPersonalNumber("");
    setPhone("");
    setIsActive(true);
    setErrors({});
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName("");
    setPersonalNumber("");
    setPhone("");
    setIsActive(true);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Mitarbeiter anlegen</h2>
            </div>
            <button
              onClick={handleCancel}
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
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.name ? "border-red-500" : "border-border"
                }`}
                placeholder="Max Mustermann"
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

          {/* Personal number */}
            <div>
            <label htmlFor="pnr" className="block text-sm font-medium mb-1">
              Personalnummer *
              </label>
              <input
              id="pnr"
              type="text"
              value={personalNumber}
              onChange={(e) => {
                setPersonalNumber(e.target.value.replace(/\D/g, ""));
                setErrors((prev) => ({ ...prev, personalNumber: undefined }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.personalNumber ? "border-red-500" : "border-border"
                }`}
              placeholder="z. B. 01234"
              />
            {errors.personalNumber && (
              <p className="text-xs text-red-600 mt-1">{errors.personalNumber}</p>
              )}
            </div>

          {/* No Passwort here: employees will set it during registration */}

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Telefon
              </label>
              <input
                id="phone"
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
                id="active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-brand focus:ring-2 focus:ring-brand rounded"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Aktiv
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={handleCancel}
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

