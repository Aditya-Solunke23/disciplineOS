import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, Plus, MoreVertical, Trash2, Edit, BookCheck, Target } from "lucide-react";
import { useBooks, Book } from "@/hooks/useBooks";
import { Label } from "@/components/ui/label";

function AddBookDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addBook } = useBooks();
  const [title, setTitle] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [dailyGoal, setDailyGoal] = useState("20");

  const handleSubmit = () => {
    if (!title.trim() || !totalPages) return;
    addBook.mutate(
      { title: title.trim(), total_pages: parseInt(totalPages), daily_goal_pages: parseInt(dailyGoal) || 20 },
      { onSuccess: () => { setTitle(""); setTotalPages(""); setDailyGoal("20"); onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Book</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Book title" /></div>
          <div><Label>Total Pages</Label><Input type="number" value={totalPages} onChange={e => setTotalPages(e.target.value)} placeholder="e.g. 300" /></div>
          <div><Label>Daily Goal (pages)</Label><Input type="number" value={dailyGoal} onChange={e => setDailyGoal(e.target.value)} placeholder="20" /></div>
          <Button onClick={handleSubmit} disabled={!title.trim() || !totalPages || addBook.isPending} className="w-full">Add Book</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LogPagesDialog({ book, open, onOpenChange }: { book: Book; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { logPages } = useBooks();
  const [pages, setPages] = useState("");

  const handleSubmit = () => {
    const p = parseInt(pages);
    if (!p || p <= 0) return;
    logPages.mutate(
      { id: book.id, pagesRead: p, currentPage: book.current_page, totalPages: book.total_pages },
      { onSuccess: () => { setPages(""); onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Pages — {book.title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Currently on page {book.current_page} of {book.total_pages}</p>
        <div className="space-y-4">
          <div><Label>Pages Read Today</Label><Input type="number" value={pages} onChange={e => setPages(e.target.value)} placeholder={`Goal: ${book.daily_goal_pages}`} /></div>
          <Button onClick={handleSubmit} disabled={!pages || logPages.isPending} className="w-full">Log Progress</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditBookDialog({ book, open, onOpenChange }: { book: Book; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { updateBook } = useBooks();
  const [title, setTitle] = useState(book.title);
  const [totalPages, setTotalPages] = useState(String(book.total_pages));
  const [dailyGoal, setDailyGoal] = useState(String(book.daily_goal_pages));

  const handleSubmit = () => {
    if (!title.trim() || !totalPages) return;
    updateBook.mutate(
      { id: book.id, title: title.trim(), total_pages: parseInt(totalPages), daily_goal_pages: parseInt(dailyGoal) || 20 },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Book</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Total Pages</Label><Input type="number" value={totalPages} onChange={e => setTotalPages(e.target.value)} /></div>
          <div><Label>Daily Goal (pages)</Label><Input type="number" value={dailyGoal} onChange={e => setDailyGoal(e.target.value)} /></div>
          <Button onClick={handleSubmit} disabled={!title.trim() || !totalPages || updateBook.isPending} className="w-full">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookCard({ book }: { book: Book }) {
  const { deleteBook } = useBooks();
  const [logOpen, setLogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const progress = book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0;
  const pagesLeft = book.total_pages - book.current_page;
  const daysLeft = book.daily_goal_pages > 0 ? Math.ceil(pagesLeft / book.daily_goal_pages) : 0;

  return (
    <>
      <Card className={book.completed ? "opacity-60" : ""}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{book.title}</h3>
                {book.completed && <Badge variant="secondary" className="shrink-0"><BookCheck className="h-3 w-3 mr-1" />Done</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {book.current_page} / {book.total_pages} pages
                {!book.completed && daysLeft > 0 && <span className="ml-2">· ~{daysLeft} days left</span>}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteBook.mutate(book.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}% complete</span>
              <span className="flex items-center gap-1"><Target className="h-3 w-3" />{book.daily_goal_pages} pages/day</span>
            </div>
          </div>

          {!book.completed && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setLogOpen(true)}>
              <BookOpen className="h-4 w-4 mr-2" />Log Pages
            </Button>
          )}
        </CardContent>
      </Card>
      <LogPagesDialog book={book} open={logOpen} onOpenChange={setLogOpen} />
      <EditBookDialog book={book} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

export default function Reading() {
  const { booksQuery } = useBooks();
  const [addOpen, setAddOpen] = useState(false);

  const books = booksQuery.data ?? [];
  const activeBooks = books.filter(b => !b.completed);
  const completedBooks = books.filter(b => b.completed);
  const totalPagesRead = books.reduce((sum, b) => sum + b.current_page, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reading Tracker</h1>
          <p className="text-muted-foreground text-sm">A reader lives a thousand lives.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Book</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{activeBooks.length}</p><p className="text-xs text-muted-foreground">Currently Reading</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{completedBooks.length}</p><p className="text-xs text-muted-foreground">Books Completed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalPagesRead.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Pages Read</p></CardContent></Card>
      </div>

      {activeBooks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Currently Reading</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBooks.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </div>
      )}

      {completedBooks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedBooks.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </div>
      )}

      {books.length === 0 && !booksQuery.isLoading && (
        <Card><CardContent className="p-8 text-center"><BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No books yet. Add one to start tracking your reading.</p></CardContent></Card>
      )}

      <AddBookDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
