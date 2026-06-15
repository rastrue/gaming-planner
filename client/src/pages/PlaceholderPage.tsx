import Card from '../components/ui/Card';

export interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main>
      <Card title={title} description={description ?? 'Запрошенная страница не найдена.'}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Проверьте адрес или вернитесь на панель через меню навигации.
        </p>
      </Card>
    </main>
  );
}
