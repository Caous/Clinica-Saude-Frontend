/** Saudação usada quando a tela não informa uma mensagem específica. */
export const MENSAGEM_PADRAO_WHATSAPP =
  "Olá tudo bem? Somos a equipe do Instituto Barros 😀";

/**
 * Token que as mensagens do registry usam para marcar onde entra o nome do paciente.
 * Fica aqui, e não no registry, para que o texto e a substituição não possam divergir.
 */
export const TOKEN_NOME_CLIENTE = "{nome_cliente}";

const DDI_BRASIL = "55";

/** DDD (2) + telefone (8 ou 9). Abaixo disso não há como abrir conversa. */
const MINIMO_DE_DIGITOS = 10;

/**
 * Substitui `{nome_cliente}` pelo nome do paciente daquela linha.
 *
 * Sem nome utilizável o token some junto com o espaço que o precede — caso contrário a
 * mensagem chegaria ao paciente como "Olá , tudo bem?" ou, pior, com o token cru visível.
 *
 * @returns a mensagem pronta para virar `text` do link.
 */
export function aplicarNomeNaMensagem(
  mensagem: string,
  nome: string | null | undefined
): string {
  const nomeLimpo = (nome ?? "").trim();

  if (!nomeLimpo) return mensagem.replace(/[ \t]*\{nome_cliente\}/g, "");

  return mensagem.split(TOKEN_NOME_CLIENTE).join(nomeLimpo);
}

/**
 * Monta o link de conversa do WhatsApp a partir de um telefone mascarado.
 *
 * Substitui o `href` que estava duplicado em CustomerGrid e EmployeeGrid, onde a limpeza
 * era feita com `.replace('(', '').replace(')', '')...` — encadeamento que remove apenas a
 * primeira ocorrência de cada caractere, deixando separador para trás em telefones com
 * mais de um espaço.
 *
 * @returns o link, ou `null` quando não há telefone utilizável — assim a tela decide não
 *          renderizar um link morto em vez de abrir o WhatsApp num número inválido.
 */
export function montarLinkWhatsapp(
  telefone: string | null | undefined,
  mensagem: string = MENSAGEM_PADRAO_WHATSAPP
): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "");

  if (digitos.length < MINIMO_DE_DIGITOS) return null;

  const numero = digitos.startsWith(DDI_BRASIL) ? digitos : `${DDI_BRASIL}${digitos}`;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
