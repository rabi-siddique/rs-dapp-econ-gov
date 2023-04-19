import clsx from 'clsx';

const buttonClasses = (canSubmit: boolean) =>
  clsx(
    'btn-primary px-3 py-2 rounded mt-2',
    canSubmit ? 'cursor-pointer' : 'cursor-not-allowed',
  );

const defaultText = 'Submit';

type ButtonProps = {
  canSubmit?: boolean;
  text?: string;
  handleSubmit?: (event: any) => void;
};

export const SubmitButton = ({
  canSubmit = false,
  text = defaultText,
  handleSubmit = () => {
    /* no-op */
  },
}: ButtonProps) => (
  <button
    className={buttonClasses(canSubmit)}
    disabled={!canSubmit}
    onClick={handleSubmit}
  >
    {text}
  </button>
);

type InputProps = {
  canSubmit?: boolean;
  value?: string;
};

export const SubmitInput = ({
  canSubmit = false,
  value = defaultText,
}: InputProps) => (
  <input
    type="submit"
    value={value}
    className={clsx(
      'btn-primary p-2 rounded mt-2',
      canSubmit ? 'cursor-pointer' : 'cursor-not-allowed',
    )}
    disabled={!canSubmit}
  />
);
