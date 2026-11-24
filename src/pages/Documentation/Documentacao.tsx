import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  DOCUMENTACAO,
  DocModule,
  DocSection,
  DocDownload,
} from "../../data/documentacao";
import { useBranding } from "../../hooks/useBranding";
import {
  getUserRoleFromToken,
  userHasRole,
} from "../../services/util/rolePermissions";

/** Gera o arquivo no navegador (via Blob) e dispara o download. Sem backend. */
function baixarArquivo(download: DocDownload, brandName: string) {
  const content = download.buildContent?.(brandName) ?? download.content ?? "";
  const blob = new Blob([content], { type: download.mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = download.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SectionAccordion({ section }: { section: DocSection }) {
  const brand = useBranding();
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-medium text-gray-800 dark:text-white/90">
          {section.titulo}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${aberto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {aberto && (
        <div className="space-y-4 border-t border-gray-100 px-4 py-4 dark:border-gray-800">
          {section.intro && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{section.intro}</p>
          )}

          {section.passos && section.passos.length > 0 && (
            <ol className="space-y-3">
              {section.passos.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{p.titulo}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{p.descricao}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {section.regras && section.regras.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-900/10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Regras de negócio
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {section.regras.map((r, i) => (
                  <li key={i} className="text-sm text-amber-800 dark:text-amber-300">{r}</li>
                ))}
              </ul>
            </div>
          )}

          {section.dicas && section.dicas.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-900/10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                Dicas
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {section.dicas.map((d, i) => (
                  <li key={i} className="text-sm text-blue-800 dark:text-blue-300">{d}</li>
                ))}
              </ul>
            </div>
          )}

          {section.downloads && section.downloads.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {section.downloads.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => baixarArquivo(d, brand.name)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Documentacao() {
  const userRoles = useMemo(
    () => getUserRoleFromToken(localStorage.getItem("token")),
    []
  );

  // Filtra os módulos pelo perfil do usuário
  const modulos = useMemo<DocModule[]>(() => {
    return DOCUMENTACAO.filter(
      (m) =>
        m.roles.length === 0 ||
        m.roles.some((r) => userHasRole(userRoles, r))
    );
  }, [userRoles]);

  const [selecionado, setSelecionado] = useState<string>(
    modulos[0]?.id ?? ""
  );

  const moduloAtivo = modulos.find((m) => m.id === selecionado) ?? modulos[0];

  return (
    <>
      <PageMeta
        title="Documentação"
        description="Documentação do sistema para usuários — guia prático de cada menu"
      />
      <PageBreadcrumb pageTitle="Documentação" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Lista de módulos */}
        <aside className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Módulos
          </p>
          <nav className="space-y-1">
            {modulos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelecionado(m.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  moduloAtivo?.id === m.id
                    ? "bg-brand-500 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-base">{m.icone}</span>
                <span className="font-medium">{m.titulo}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Conteúdo do módulo */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          {moduloAtivo ? (
            <>
              <div className="mb-5 flex items-start gap-3">
                <span className="text-3xl">{moduloAtivo.icone}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                    {moduloAtivo.titulo}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {moduloAtivo.resumo}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {moduloAtivo.secoes.map((s, i) => (
                  <SectionAccordion key={i} section={s} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma documentação disponível para o seu perfil.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
