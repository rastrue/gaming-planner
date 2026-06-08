import Card from '../components/ui/Card';

export interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main>
      <Card title={title} description={description ?? 'The requested page could not be found.'}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Check the address or return to your dashboard using the navigation menu.
        </p>
      </Card>
    </main>
  );
}
