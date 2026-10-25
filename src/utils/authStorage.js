export function saveAuthSession(data) {
  const roleValue = data.userType || data.role || ''
  const role = String(roleValue).toLowerCase()
  // Session storage is cleared when the browser session ends, so every new
  // visit requires the user to sign in again.
  sessionStorage.setItem('token', data.accessToken || data.token)
  sessionStorage.setItem('userType', roleValue)
  const apiAgentName = data.agentName || data.AgentName || data.user?.agentName || data.user?.AgentName
  const displayName = (role === 'agent' || role === '3' ? apiAgentName : null) || data.name || data.userName || data.fullName || apiAgentName || data.user?.name || data.user?.userName
  if (displayName) sessionStorage.setItem('userName', displayName)
  else sessionStorage.removeItem('userName')
  sessionStorage.removeItem('countryId')
  sessionStorage.removeItem('agentName')
  sessionStorage.removeItem('agentPhoneNumber')

  if ((role === 'admin' || role === '2') && data.countryId != null) {
    sessionStorage.setItem('countryId', String(data.countryId))
  }
  if (role === 'agent' || role === '3') {
    if (data.countryId != null) sessionStorage.setItem('countryId', String(data.countryId))
    if (apiAgentName) sessionStorage.setItem('agentName', String(apiAgentName))
    const phoneNumber = data.PhoneNumber || data.phoneNumber || data.phone || data.user?.PhoneNumber || data.user?.phoneNumber
    if (phoneNumber != null) sessionStorage.setItem('agentPhoneNumber', String(phoneNumber))
  }
}
