import { Redirect } from 'expo-router';

import { useAuthSession } from '@/presentation/hooks/useAuthSession';

// Destino do deep link de retorno do OAuth (octolens://redirect).
//
// O expo-auth-session já consome essa URL pelo openAuthSessionAsync e extrai o
// authorization code — a autenticação não depende desta rota. Ela existe porque
// o expo-router também recebe o deep link e o resolve como navegação: sem um
// arquivo correspondente, cai na tela "Unmatched route" no meio do login.
//
// O destino é explícito, e não `/`, por causa de como o Stack.Protected se
// recupera: quando um guard passa a ser falso o roteador descarta o histórico
// daquele grupo e cai "na rota âncora ou na primeira tela disponível do stack".
// Esta rota vive fora dos dois guards, então ela é essa primeira tela — o
// roteador estaciona aqui no exato instante do login. Com `/` o componente não
// tinha motivo para renderizar de novo e ficava mostrando nada (tela preta).
// Lendo a sessão, ele re-renderiza junto com a troca do guard e sai para o
// grupo certo.
export default function OAuthRedirect() {
  const { isAuthenticated, isHydrating } = useAuthSession();

  if (isHydrating) {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)'} />;
}
