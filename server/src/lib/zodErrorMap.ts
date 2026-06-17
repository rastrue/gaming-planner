import { z } from 'zod';

const russianErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: 'Обязательное поле' };
      }
      return { message: `Ожидается ${issue.expected}, получено ${issue.received}` };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Недопустимое значение' };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'Укажите корректный email' };
      }
      if (issue.validation === 'url') {
        return { message: 'Укажите корректный URL' };
      }
      if (issue.validation === 'uuid') {
        return { message: 'Укажите корректный UUID' };
      }
      if (issue.validation === 'regex') {
        return { message: 'Недопустимый формат' };
      }
      break;
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return {
          message:
            issue.minimum === 1
              ? 'Поле не может быть пустым'
              : `Строка должна содержать минимум ${issue.minimum} символ(ов)`,
        };
      }
      if (issue.type === 'number') {
        return { message: `Число должно быть не меньше ${issue.minimum}` };
      }
      if (issue.type === 'array') {
        return { message: `Массив должен содержать минимум ${issue.minimum} элемент(ов)` };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Строка должна содержать не более ${issue.maximum} символ(ов)` };
      }
      if (issue.type === 'number') {
        return { message: `Число должно быть не больше ${issue.maximum}` };
      }
      if (issue.type === 'array') {
        return { message: `Массив должен содержать не более ${issue.maximum} элемент(ов)` };
      }
      break;
    case z.ZodIssueCode.not_multiple_of:
      return { message: `Число должно быть кратно ${issue.multipleOf}` };
    case z.ZodIssueCode.invalid_date:
      return { message: 'Некорректная дата' };
    default:
      break;
  }

  return { message: ctx.defaultError };
};

export function setupZodErrorMap(): void {
  z.setErrorMap(russianErrorMap);
}
