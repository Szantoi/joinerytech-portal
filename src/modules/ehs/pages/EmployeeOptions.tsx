/** EHS employee-directory options kept in the EHS bounded context. */
export function EmployeeOptions({ employees }: { employees: { id: string; name: string }[] }) {
  return (
    <>
      {employees.map((employee) => (
        <option key={employee.id} value={employee.id}>{employee.name}</option>
      ))}
    </>
  )
}
