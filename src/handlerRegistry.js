// Handler registry - maps handler names to actual functions
export const handlerRegistry = {
  consoleHandler: (data) => console.log('Job executed:', data),
  emailHandler: (data) => console.log('Sending email:', data),
  defaultHandler: (data) => console.log('Default handler:', data),
};
