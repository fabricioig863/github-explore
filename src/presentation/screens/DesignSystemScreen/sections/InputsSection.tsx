import { Input } from '@/presentation/design-system/Input';

import { ShowBlock } from '../components/ShowBlock';

export function InputsSection() {
  return (
    <ShowBlock title="Inputs">
      <Input value="dev@octolens.app" helperText="Seu email para login" editable={false} />
      <Input value="invalid-email" error="Email inválido — verifique o formato" editable={false} />
    </ShowBlock>
  );
}
