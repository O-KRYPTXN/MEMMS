/**
 * Generic validation middleware using Zod.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {string} source - The request property to validate ('body', 'query', 'params'). Defaults to 'body'.
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((err) => err.message).join(', ');
      return res.status(400).json({ message: errorMessages });
    }
    
    // Replace the request property with the parsed (and potentially transformed/type-coerced) data
    if (source === 'body') {
      req[source] = parsed.data;
    } else {
      // req.query and req.params often have only getters in Express, so we must redefine the property
      Object.defineProperty(req, source, {
        value: parsed.data,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    next();
  };
};
