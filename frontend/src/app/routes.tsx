import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** Nevesített exportból lusta route-komponens; minden oldal külön chunkba kerül. */
function page<K extends string>(
  load: () => Promise<Record<K, ComponentType>>,
  name: K,
): LazyExoticComponent<ComponentType> {
  return lazy(async () => ({ default: (await load())[name] }))
}

export const Home = page(() => import('../features/home/Home'), 'Home')
export const Curriculum = page(() => import('../features/catalog/pages/Curriculum'), 'Curriculum')
export const TrackPage = page(() => import('../features/catalog/pages/TrackPage'), 'TrackPage')
export const TaskList = page(() => import('../features/catalog/pages/TaskList'), 'TaskList')
export const TaskSolve = page(() => import('../features/workspace/pages/TaskSolve'), 'TaskSolve')
export const Register = page(() => import('../features/auth/pages/Register'), 'Register')
export const RegisterDone = page(() => import('../features/auth/pages/RegisterDone'), 'RegisterDone')
export const Login = page(() => import('../features/auth/pages/Login'), 'Login')
export const VerifyEmail = page(() => import('../features/auth/pages/VerifyEmail'), 'VerifyEmail')
export const ForgotPassword = page(() => import('../features/auth/pages/ForgotPassword'), 'ForgotPassword')
export const ResetPassword = page(() => import('../features/auth/pages/ResetPassword'), 'ResetPassword')
export const Subscribe = page(() => import('../features/billing/pages/Subscribe'), 'Subscribe')
export const ProgressDashboard = page(() => import('../features/progress/pages/ProgressDashboard'), 'ProgressDashboard')
export const AdminCatalog = page(() => import('../features/admin/catalog/pages/AdminCatalog'), 'AdminCatalog')
export const AdminTrack = page(() => import('../features/admin/catalog/pages/AdminTrack'), 'AdminTrack')
export const AdminModule = page(() => import('../features/admin/catalog/pages/AdminModule'), 'AdminModule')
export const AdminLesson = page(() => import('../features/admin/catalog/pages/AdminLesson'), 'AdminLesson')
export const AdminExercise = page(() => import('../features/admin/catalog/pages/AdminExercise'), 'AdminExercise')
export const AdminNewExercise = page(() => import('../features/admin/catalog/pages/AdminExercise'), 'AdminNewExercise')
export const AdminUsers = page(() => import('../features/admin/users/pages/AdminUsers'), 'AdminUsers')
export const AdminUserDetail = page(() => import('../features/admin/users/pages/AdminUserDetail'), 'AdminUserDetail')
export const PaymentReturn = page(() => import('../features/billing/pages/PaymentReturn'), 'PaymentReturn')
export const Account = page(() => import('../features/account/pages/Account'), 'Account')
export const EmailChangeConfirm = page(() => import('../features/account/pages/EmailChangeConfirm'), 'EmailChangeConfirm')
export const Terms = page(() => import('../features/legal/pages/LegalPage'), 'Terms')
export const Privacy = page(() => import('../features/legal/pages/LegalPage'), 'Privacy')
export const Imprint = page(() => import('../features/legal/pages/LegalPage'), 'Imprint')
export const AdminInvoices = page(() => import('../features/admin/invoices/pages/AdminInvoices'), 'AdminInvoices')
