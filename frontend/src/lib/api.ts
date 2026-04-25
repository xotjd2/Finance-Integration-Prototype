import type { DashboardResponse, InterfaceFormValues, InterfaceItem } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/dashboard`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("대시보드 데이터를 불러오지 못했습니다.");
  }
  return response.json();
}

export async function createManagedInterface(payload: InterfaceFormValues): Promise<InterfaceItem> {
  const response = await fetch(`${API_BASE_URL}/interfaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("인터페이스 등록에 실패했습니다.");
  }

  return response.json();
}

export async function updateManagedInterface(
  id: string,
  payload: InterfaceFormValues,
): Promise<InterfaceItem> {
  const response = await fetch(`${API_BASE_URL}/interfaces/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("인터페이스 설정 저장에 실패했습니다.");
  }

  return response.json();
}

export async function retryManagedInterface(id: string): Promise<InterfaceItem> {
  const response = await fetch(`${API_BASE_URL}/interfaces/${id}/retry`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("재처리에 실패했습니다.");
  }

  return response.json();
}

export async function deleteManagedInterface(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/interfaces/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("인터페이스 삭제에 실패했습니다.");
  }
}
