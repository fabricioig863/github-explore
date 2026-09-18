// Stub de web para o Reactotron.
//
// O `reactotron-react-native` toca em NativeModules/BatchedBridge assim que é
// importado, e o `import` do ReactotronConfig no layout raiz não é protegido
// pelo __DEV__ (imports são hoisted — o módulo carrega sempre). No bundle web
// isso quebra: o `web.output: "static"` do app.json faz o dev server renderizar
// as rotas dentro do Node, onde __fbBatchedBridgeConfig não existe.
//
// O Metro resolve `.web.ts` antes de `.ts` quando platform=web, então este
// arquivo substitui o de verdade no web sem tocar em quem importa. O Reactotron
// é ferramenta de debug de app nativo; no web não há nada a conectar.
export default undefined;
