import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export default function Container({ children, className = '' }: ContainerProps) {
  return (
    <>
      <style>{`
        .msp-container {
          width: 100%;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 32px;
          padding-right: 32px;
        }
        @media (max-width: 768px) {
          .msp-container { padding-left: 16px; padding-right: 16px; }
        }
        @media (max-width: 480px) {
          .msp-container { padding-left: 16px; padding-right: 16px; }
        }
      `}</style>
      <div className={`msp-container ${className}`}>
        {children}
      </div>
    </>
  )
}
