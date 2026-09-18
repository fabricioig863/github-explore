export interface SavedRepo {
  id: number;
  fullName: string;
  name: string;
  ownerLogin: string;
  ownerAvatarUrl: string;
  language: string | null;
  htmlUrl: string;
  savedAt: Date;
  // Guardados no momento de salvar porque a categorização em coleções depende
  // deles, e a tela de Salvos funciona offline — não há de onde rebuscar.
  topics: string[];
  description: string | null;
}
