import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  category: string | null;
  description: string | null;
  transaction_date: string;
  created_at: string;
};

export type TransactionInsert = {
  amount: number;
  transaction_type: string;
  category?: string;
  description?: string;
  transaction_date?: string;
};

export const EXPENSE_CATEGORIES = [
  "Food", "Transport", "Housing", "Entertainment", "Health",
  "Education", "Shopping", "Subscriptions", "Other",
];

export const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Investment", "Gift", "Other",
];

export function useFinances() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["finances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finances")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: async (tx: TransactionInsert) => {
      const { data, error } = await supabase
        .from("finances")
        .insert({ ...tx, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finances"] });
      toast.success("Transaction added");
    },
    onError: () => toast.error("Failed to add transaction"),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finances"] });
      toast.success("Transaction deleted");
    },
    onError: () => toast.error("Failed to delete transaction"),
  });

  return { transactionsQuery, addTransaction, deleteTransaction };
}
