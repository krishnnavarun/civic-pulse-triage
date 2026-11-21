export const categoryDepartments = {
  Roads: 'Public Works Department',
  Sanitation: 'Water & Sanitation',
  Electricity: 'Electricity Board',
  'Water Supply': 'Water Board',
  Pollution: 'Pollution Control Board',
  'Public Safety': 'Police Department',
  Other: 'Municipal Helpdesk',
}

export function triage(description, category) {
  const text = description.toLowerCase()
  const urgentWords = ['accident', 'danger', 'fire', 'collapse', 'exposed', 'injury', 'overflow', 'flood', 'blocked']
  const severeWords = ['large', 'deep', 'broken', 'blocked', 'waste', 'smoke', 'pollution']
  const severity = urgentWords.some((word) => text.includes(word))
    ? 'High'
    : severeWords.some((word) => text.includes(word))
      ? 'Medium'
      : 'Low'

  return { severity, department: categoryDepartments[category] }
}
