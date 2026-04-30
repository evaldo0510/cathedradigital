export const CATECHISM_LOCAL_DATA = {
  "1": {
    "id": "1",
    "paragraph": 1,
    "tipo": "catecismo",
    "type": "catechism",
    "tags": [], // HIGH severity error
    "titulo": "Teste High",
    "conteudo": "Conteudo"
  },
  "2": {
    "id": "", // MEDIUM severity error
    "paragraph": 2,
    "tipo": "catecismo",
    "type": "catechism",
    "tags": ["tag"],
    "titulo": "Teste Medium",
    "conteudo": "Conteudo"
  },
  "3": {
    "id": "3",
    "paragraph": 3,
    "tipo": "catecismo",
    "type": "catechism",
    "tags": ["tag"],
    "titulo": "", // LOW severity error
    "conteudo": "Conteudo"
  }
};
