import { BaseRequestDto } from "./BaseRequestDto";

export interface BranchOfficeRequestDto extends BaseRequestDto {
    nomeFilial: string;
    observacao: string;
    endereco: {
        rua: string;
        cep: string;
        numero: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
    };
    matriz: boolean;
    idGerenteFilial?: string;
    /** `HH:mm:ss` ou null (usa o padrão 08:00 da agenda). */
    horarioAbertura?: string | null;
    /** `HH:mm:ss` ou null (usa o padrão 22:00 da agenda). */
    horarioFechamento?: string | null;
}
