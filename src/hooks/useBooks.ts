import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Book = {
  id: string;
  user_id: string;
  title: string;
  total_pages: number;
  current_page: number;
  daily_goal_pages: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export function useBooks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const booksQuery = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("completed", { ascending: true })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Book[];
    },
    enabled: !!user,
  });

  const addBook = useMutation({
    mutationFn: async (book: { title: string; total_pages: number; daily_goal_pages?: number }) => {
      const { data, error } = await supabase
        .from("books")
        .insert({ ...book, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book added");
    },
    onError: () => toast.error("Failed to add book"),
  });

  const updateBook = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Book> & { id: string }) => {
      const { data, error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book updated");
    },
    onError: () => toast.error("Failed to update book"),
  });

  const logPages = useMutation({
    mutationFn: async ({ id, pagesRead, currentPage, totalPages }: { id: string; pagesRead: number; currentPage: number; totalPages: number }) => {
      const newPage = Math.min(currentPage + pagesRead, totalPages);
      const completed = newPage >= totalPages;
      const { data, error } = await supabase
        .from("books")
        .update({ current_page: newPage, completed })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      if (data.completed) {
        toast.success("🎉 Book completed! Well done!");
      } else {
        toast.success("Progress logged");
      }
    },
    onError: () => toast.error("Failed to log pages"),
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book removed");
    },
    onError: () => toast.error("Failed to delete book"),
  });

  return { booksQuery, addBook, updateBook, logPages, deleteBook };
}
