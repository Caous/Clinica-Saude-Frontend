import { CustomerResponseDto } from "./CustomerResponseDto";
import { EmployeeResponseDto } from "./EmployeeResponseDto";
import { BaseResponseDto } from "./BaseResponseDto";

export interface ScheduleResponseDto extends BaseResponseDto {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: Date; 
  dataFim: Date;   
  diaTodo: boolean;
  usuarioResponsavelId?: string | null;
  idCliente?: string | null;
  idFuncionario?: string | null;
  filialId?: string | null;
  clienteId?: string | null;
  funcionarioId?: string | null;
  cliente?: CustomerResponseDto | null;
  funcionario?: EmployeeResponseDto | null;
  localizacao: string;
  observacao: string;
  notificar: boolean;
  minutosAntesNotificacao?: number | null;
  status: number;
  corFuncionario?: string;
  isAvaliacao?: boolean;
  checkIns?: ScheduleCheckInDto[] | null;
}

export interface ScheduleCheckInDto {
  dataSessao: string;
  horaSessao: string;
  statusSessao: number;
  tipoCheckIn: number; // 0 = Fisio, 1 = Plano
  funcionario?: string | null;
}
