import { useRef } from "react";
import { Form, type FormProps } from "react-router";

export interface AutosaveFormProps extends FormProps {
  action?: string;
}

const AutosaveForm = ({ children, action, ...props }: AutosaveFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const onChange = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 500);
  };

  return (
    <Form ref={formRef} onChange={onChange} {...props}>
      {action && <input type="hidden" name="_action" value={action} />}
      {children}
    </Form>
  );
};

export default AutosaveForm;
