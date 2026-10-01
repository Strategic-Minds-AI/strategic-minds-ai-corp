import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import BlogPostEditor from './BlogPostEditor';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function parseDate(s) { return s ? new Date(s) : null; }
function isSameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && b.getDate() === b.getDate(); }

export default function BlogEditorialCalendar() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [editing, setEditing] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { items } = await base44.entities.Post.filter({}, { sort: 'publish_date', limit: 500, fields: ['title', 'slug', 'publish_date', 'excerpt', 'categories', 'content_markdown', 'image_url', 'display_order'] });
      setPosts(items);
      setError('');
    } catch (e) { setError(e.message || 'Could not load posts.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) { const d = new Date(year, month, -startWeekday + i + 1); cells.push({ date: d, trailing: true }); }
  for (let i = 1; i <= daysInMonth; i++) cells.push({ date: new Date(year, month, i), trailing: false });
  while (cells.length % 7 !== 0) { const last = cells[cells.length - 1].date; const d = new Date(last); d.setDate(d.getDate() + 1); cells.push({ date: d, trailing: true }); }
  while (cells.length < 42) { const last = cells[cells.length - 1].date; const d = new Date(last); d.setDate(d.getDate() + 1); cells.push({ date: d, trailing: true }); }

  const postsByDay = {};
  for (const p of posts) {
    const d = parseDate(p.publish_date);
    if (d) { const key = dateKey(d); if (!postsByDay[key]) postsByDay[key] = []; postsByDay[key].push(p); }
  }

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const srcDay = result.source.droppableId.replace('day-', '');
    const dstDay = result.destination.droppableId.replace('day-', '');
    if (srcDay === dstDay) return;
    const post = posts.find(p => p.id === result.draggableId);
    if (!post) return;
    const newDate = new Date(dstDay);
    const oldDate = parseDate(post.publish_date);
    if (oldDate) { newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0); }
    try {
      await base44.entities.Post.update(post.id, { publish_date: newDate.toISOString() });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, publish_date: newDate.toISOString() } : p));
    } catch (e) { setError(e.message || 'Could not reschedule post.'); }
  };

  const openNew = () => { setEditing(null); setShowEditor(true); };
  const openEdit = (post) => { setEditing(post); setShowEditor(true); };
  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => { const d = new Date(); d.setDate(1); setCurrent(d); };

  const scheduledCount = posts.filter(p => parseDate(p.publish_date) && parseDate(p.publish_date) > today).length;
  const publishedCount = posts.filter(p => parseDate(p.publish_date) && parseDate(p.publish_date) <= today).length;

  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="mb-1 text-xl">Editorial Calendar</h2>
        <p className="text-sm text-muted-foreground">{publishedCount} published · {scheduledCount} scheduled · Drag posts between days to reschedule.</p>
      </div>
      <button type="button" onClick={openNew} className="agency-button"><Plus size={16}/> New post</button>
    </div>

    {error && <p role="alert" className="text-sm text-destructive">{error} <button className="underline" onClick={() => setError('')}>Dismiss</button></p>}

    <div className="flex items-center justify-between rounded-t border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={prevMonth} className="rounded p-1.5 hover:bg-muted"><ChevronLeft size={18}/></button>
        <button type="button" onClick={nextMonth} className="rounded p-1.5 hover:bg-muted"><ChevronRight size={18}/></button>
        <span className="ml-2 text-sm font-semibold">{MONTHS[month]} {year}</span>
      </div>
      <button type="button" onClick={goToday} className="flex items-center gap-1.5 text-sm text-primary hover:underline"><Calendar size={14}/> Today</button>
    </div>

    {loading ? <p role="status" className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading calendar…</p> : <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-7 border-b border-l border-border">
        {WEEKDAYS.map(d => <div key={d} className="border-r border-t border-border bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
        {cells.map(({ date, trailing }) => {
          const key = dateKey(date);
          const dayPosts = postsByDay[key] || [];
          const isToday = isSameDay(date, today);
          return <Droppable key={key} droppableId={`day-${key}`}>
            {(provided, snapshot) => <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[110px] border-r border-t border-border p-1.5 ${trailing ? 'bg-muted/40' : 'bg-card'} ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}>
              <div className={`mb-1 text-right text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{date.getDate()}</div>
              <div className="space-y-1">
                {dayPosts.map((post, idx) => <Draggable key={post.id} draggableId={post.id} index={idx}>
                  {(prov) => <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} onClick={() => openEdit(post)} className="cursor-pointer rounded bg-primary/10 px-2 py-1 text-xs text-foreground hover:bg-primary/20" title={post.title}>
                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${parseDate(post.publish_date) > today ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                    <span className="line-clamp-1">{post.title}</span>
                  </div>}
                </Draggable>)}
                {provided.placeholder}
              </div>
            </div>}
          </Droppable>;
        })}
      </div>
    </DragDropContext>}

    {showEditor && <BlogPostEditor post={editing} onClose={() => setShowEditor(false)} onSaved={refresh} />}
  </div>;
}