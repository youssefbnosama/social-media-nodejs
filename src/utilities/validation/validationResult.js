import { validationResult } from "express-validator";
import AppError from "../errorHandling/classObject";

export const stopOnError = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return next(new AppError(firstError, 400, true));
  }
  next();
};
