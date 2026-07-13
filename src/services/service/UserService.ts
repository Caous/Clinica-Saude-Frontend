import { instanceApi } from "./AxioService";
import { UserAccessResponseDto } from "../model/Dto/Response/UserAccessResponseDto";

const endpoint = "/User";

export const UserService = {
  async getUserAccessByFuncionarioId(
    funcionarioId: string
  ): Promise<UserAccessResponseDto | null> {
    try {
      const response = await instanceApi.get(
        `${endpoint}/FuncionarioAccess/${funcionarioId}`
      );
      return response.data;
    } catch {
      return null;
    }
  },

  async removeRole(userId: string, role: string): Promise<boolean> {
    try {
      await instanceApi.delete(`${endpoint}/${userId}/Role/${role}`);
      return true;
    } catch {
      return false;
    }
  },

  async addRole(userId: string, role: string): Promise<boolean> {
    try {
      await instanceApi.post(`${endpoint}/${userId}/Role/${role}`);
      return true;
    } catch {
      return false;
    }
  },
};

export default UserService;
