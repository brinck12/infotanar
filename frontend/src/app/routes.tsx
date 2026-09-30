import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** Nevesített exportból lusta route-komponens; minden oldal külön chunkba kerül. */
function page<K extends string>(
  load: () => Promise<Record<K, ComponentType>>,
  name: K,
): LazyExoticComponent<ComponentType> {
  return lazy(async () => ({ default: (await load())[name] }))
}

export const Home = page(() => import('../features/home/Home'), 'Home')
export const TaskList = page(() => import('../features/catalog/pages/TaskList'), 'TaskList')
export const TaskSolve = page(() => import('../features/workspace/pages/TaskSolve'), 'TaskSolve')
export const Register = page(() => import('../features/auth/pages/Register'), 'Register')
export const RegisterDone = page(() => import('../features/auth/pages/RegisterDone'), 'RegisterDone')
export const Login = page(() => import('../features/auth/pages/Login'), 'Login')
export const VerifyEmail = page(() => import('../features/auth/pages/VerifyEmail'), 'VerifyEmail')
export const ForgotPassword = page(() => import('../features/auth/pages/ForgotPassword'), 'ForgotPassword')
export const ResetPassword = page(() => import('../features/auth/pages/ResetPassword'), 'ResetPassword')
