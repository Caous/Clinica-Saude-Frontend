import { EmployeeRequestDto } from "../model/Dto/Request/EmployeeRequestDto";
import { EmployeeResponseDto } from "../model/Dto/Response/EmployeeResponseDto";
import { RestoreResponseDto } from "../model/Dto/Response/RestoreResponseDto";
import { instanceApi } from "./AxioService";

const endpoint = "/Employee";

export const EmployeeService = {
  async getAll(): Promise<EmployeeResponseDto[]> {
    const response = await instanceApi.get(`${endpoint}`);
    return response.data;
  },

  async getById(id: string): Promise<EmployeeResponseDto> {
    const response = await instanceApi.get(`${endpoint}/${id}`);
    return response.data;
  },

  async create(data: EmployeeRequestDto) {
    return await instanceApi.post(`${endpoint}`, data);
  },

  async update(data: EmployeeRequestDto) {
    return await instanceApi.put(`${endpoint}`, data);
  },

  async delete(id: string): Promise<void> {
    await instanceApi.delete(`${endpoint}/${id}`);
  },

  async disable(id: string): Promise<void> {
    await instanceApi.put(`${endpoint}/Desativarfuncionario/${id}`);
  },

  // Reverte a exclusão lógica (apenas Administrador).
  // Não devolve o acesso de login — isso exige reset de senha.
  async restore(id: string): Promise<RestoreResponseDto> {
    const response = await instanceApi.put<RestoreResponseDto>(`${endpoint}/ReativarFuncionario/${id}`);
    return response.data;
  }
};


export default EmployeeService;