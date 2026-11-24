import { describe, it, expect, vi, beforeEach } from "vitest";
import toast from "react-hot-toast";
import { instanceApi } from "./AxioService";

vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));

type RejectedHandler = (error: unknown) => Promise<unknown>;
const rejectedHandler = (): RejectedHandler =>
  (instanceApi.interceptors.response as unknown as { handlers: { rejected: RejectedHandler }[] }).handlers[0].rejected;

describe("interceptor de resposta", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
  });

  it("429 em rota comum exibe toast", async () => {
    await expect(rejectedHandler()({ response: { status: 429 }, config: { url: "/Customer" } })).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("falha em /Branding (429/401) não exibe toast nem redireciona", async () => {
    for (const status of [429, 401]) {
      await expect(rejectedHandler()({ response: { status }, config: { url: "/Branding" } })).rejects.toBeDefined();
    }
    expect(toast.error).not.toHaveBeenCalled();
  });
});
