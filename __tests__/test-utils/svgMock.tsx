import type { ReactNode } from 'react';

// react-native-svg-transformer converte .svg em componente no bundle real.
// Em teste, o moduleNameMapper aponta para este stub.
export default function SvgMock({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
