export interface Student {
  id: string
  familiya: string
  ism: string
  otasining_ismi: string
  fakultet: string
  yonalish: string
  kurs: string
  stipendiya: string
  doc_filename: string | null
  created_at: string
}

export async function getStudents(): Promise<Student[]> {
  const r = await fetch('/api/students')
  if (!r.ok) throw new Error('Failed to fetch')
  return r.json()
}

export async function addStudent(fd: FormData): Promise<Student> {
  const r = await fetch('/api/students', { method: 'POST', body: fd })
  const json = await r.json()
  if (!r.ok) throw new Error(json.error || 'Server xatosi')
  return json
}

export async function deleteStudent(id: string): Promise<void> {
  await fetch(`/api/students/${id}`, { method: 'DELETE' })
}
