import { NavLink, type NavLinkProps } from 'react-router-dom'

const activeClass = 'app-header-nav-link active'
const inactiveClass = 'app-header-nav-link'

export function NavLinkWithActive(props: NavLinkProps) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        isActive ? activeClass : inactiveClass
      }
    />
  )
}
