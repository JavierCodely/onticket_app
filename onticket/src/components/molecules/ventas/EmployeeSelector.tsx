/**
 * EmployeeSelector Component
 * Selector for choosing an employee (bartender or admin)
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Personal } from '@/types/database';
import { UserCircle } from 'lucide-react';

interface EmployeeSelectorProps {
  empleados: Personal[];
  value: string | null;
  onChange: (empleadoId: string | null) => void;
  currentUserId: string;
  disabled?: boolean;
}

export function EmployeeSelector({
  empleados,
  value,
  onChange,
  currentUserId,
  disabled,
}: EmployeeSelectorProps) {
  const currentUser = empleados.find((emp) => emp.user_id === currentUserId);
  const bartenders = empleados.filter(
    (emp) => emp.rol === 'Bartender' || emp.rol === 'Admin'
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="empleado" className="flex items-center gap-2">
        <UserCircle className="h-4 w-4" />
        Empleado
      </Label>
      <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="empleado">
          <SelectValue placeholder="Seleccionar empleado" />
        </SelectTrigger>
        <SelectContent forceNonPortal>
          {currentUser && (
            <>
              <SelectItem value={currentUser.id}>
                {currentUser.nombre} {currentUser.apellido} (Yo)
              </SelectItem>
              {bartenders.length > 0 && <div className="border-t my-1" />}
            </>
          )}
          {bartenders
            .filter((emp) => emp.user_id !== currentUserId)
            .map((empleado) => (
              <SelectItem key={empleado.id} value={empleado.id}>
                {empleado.nombre} {empleado.apellido} ({empleado.rol})
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
