import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppShell from './AppShell';

function getPageMeta(pathname: string): { title: string; description?: string } {
  if (pathname === '/dashboard') {
    return { title: 'Дашборд', description: 'Обзор и быстрые действия' };
  }

  if (/^\/events\/\d+/.test(pathname)) {
    return { title: 'Детали события', description: 'Информация о событии, состав и действия по регистрации.' };
  }

  if (pathname === '/events') {
    return { title: 'События', description: 'Просмотр предстоящих игровых сессий.' };
  }

  if (pathname === '/availability') {
    return { title: 'Планировщик доступности', description: 'Управление еженедельными окнами доступности.' };
  }

  if (pathname === '/my-registrations') {
    return { title: 'Мои регистрации', description: 'История регистраций и их статусы.' };
  }

  if (pathname === '/reports') {
    return { title: 'Отчёты', description: 'Формирование, экспорт и отправка отчётов по участию.' };
  }

  if (pathname === '/organizer/events/new') {
    return { title: 'Создание события', description: 'Публикация нового многопользовательского события.' };
  }

  if (/^\/organizer\/events\/\d+\/edit/.test(pathname)) {
    return { title: 'Редактирование события', description: 'Обновление деталей и расписания события.' };
  }

  if (pathname === '/organizer/events') {
    return { title: 'Управление событиями', description: 'Рабочая область организатора для управления событиями.' };
  }

  if (/^\/organizer\/roster\/\d+/.test(pathname)) {
    return { title: 'Доска состава', description: 'Назначение одобренных игроков на слоты состава.' };
  }

  if (pathname === '/organizer/roster') {
    return { title: 'Управление составом', description: 'Выберите событие для управления составом.' };
  }

  return { title: 'QuestSync', description: 'Страница приложения QuestSync.' };
}

export default function AuthenticatedLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const meta = getPageMeta(location.pathname);

  if (!user) {
    return null;
  }

  return (
    <AppShell
      role={user.role.name}
      currentPath={location.pathname}
      title={meta.title}
      description={meta.description}
      userDisplayName={user.displayName}
    >
      <Outlet />
    </AppShell>
  );
}
