import { z } from 'zod';

const russianErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: 'Required field' };
      }
      return { message: `Expected ${issue.expected}, received ${issue.received}` };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Invalid value' };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'Enter a valid email' };
      }
      if (issue.validation === 'url') {
        return { message: 'Enter a valid URL' };
      }
      if (issue.validation === 'uuid') {
        return { message: 'Enter a valid UUID' };
      }
      if (issue.validation === 'regex') {
        return { message: 'Invalid format' };
      }
      break;
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return {
          message:
            issue.minimum === 1
              ? 'Field cannot be empty'
              : `String must contain at least ${issue.minimum} character(s)`,
        };
      }
      if (issue.type === 'number') {
        return { message: `Number must be at least ${issue.minimum}` };
      }
      if (issue.type === 'array') {
        return { message: `Array must contain at least ${issue.minimum} element(s)` };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `String must contain at most ${issue.maximum} character(s)` };
      }
      if (issue.type === 'number') {
        return { message: `Number must be at most ${issue.maximum}` };
      }
      if (issue.type === 'array') {
        return { message: `Array must contain at most ${issue.maximum} element(s)` };
      }
      break;
    case z.ZodIssueCode.not_multiple_of:
      return { message: `Number must be a multiple of ${issue.multipleOf}` };
    case z.ZodIssueCode.invalid_date:
      return { message: 'Invalid date' };
    default:
      break;
  }

  return { message: ctx.defaultError };
};

export function setupZodErrorMap(): void {
  z.setErrorMap(russianErrorMap);
}
