import Card from '../components/ui/Card';

export interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card title={title} description={description ?? 'Page wiring placeholder for upcoming implementation.'}>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        This route is registered and protected. Full page content will be implemented in a later task.
      </p>
    </Card>
  );
}
