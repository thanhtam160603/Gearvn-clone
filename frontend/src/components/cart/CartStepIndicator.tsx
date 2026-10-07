export type CartStepId = "cart" | "shipping" | "confirmation";

type CartStepIndicatorProps = {
  currentStep?: CartStepId;
};

const steps: {
  id: CartStepId;
  label: string;
}[] = [
  {
    id: "cart",
    label: "Giỏ hàng",
  },
  {
    id: "shipping",
    label: "Thông tin giao hàng",
  },
  {
    id: "confirmation",
    label: "Xác nhận đơn hàng",
  },
];

export default function CartStepIndicator({
  currentStep = "cart",
}: CartStepIndicatorProps) {
  return (
    <nav aria-label="Tiến trình đặt hàng" className="overflow-x-auto">
      <ol className="grid min-w-[620px] grid-cols-3 gap-4">
        {steps.map((step) => {
          const isActive = step.id === currentStep;

          return (
            <li
              key={step.id}
              aria-current={isActive ? "step" : undefined}
              className={[
                "flex h-[66px] items-center justify-center gap-3 rounded-lg border",
                isActive
                  ? "border-red-600 bg-red-50 text-red-600"
                  : "border-transparent bg-transparent text-neutral-400",
              ].join(" ")}
            >
              <span
                className={[
                  "flex size-6 items-center justify-center rounded-full border-2",
                  isActive ? "border-red-600" : "border-neutral-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "size-2 rounded-full",
                    isActive ? "bg-red-600" : "bg-neutral-400",
                  ].join(" ")}
                />
              </span>

              <span className="text-sm font-medium">
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}