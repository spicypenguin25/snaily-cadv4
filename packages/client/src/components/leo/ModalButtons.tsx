import { Button } from "components/Button";
import { useLeoState } from "state/leoState";
import { ShouldDoType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { makeUnitName } from "lib/utils";
import { isUnitCombined } from "@snailycad/utils";
import * as modalButtons from "components/modal-buttons/buttons";
import { ModalButton } from "components/modal-buttons/ModalButton";
import type { PostLeoTogglePanicButtonData } from "@snailycad/types/api";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { TonesModal } from "components/dispatch/modals/TonesModal";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

const buttons: modalButtons.ModalButton[] = [
  modalButtons.switchDivision,
  modalButtons.nameSearchBtn,
  modalButtons.plateSearchBtn,
  modalButtons.weaponSearchBtn,
  modalButtons.customFieldSearchBtn,
  modalButtons.create911CallBtn,
  modalButtons.createWrittenWarningBtn,
  modalButtons.createTicketBtn,
  modalButtons.createArrestReportBtn,
  modalButtons.createWarrantBtn,
  modalButtons.createBoloBtn,
  modalButtons.notepadBtn,
];

export function ModalButtons() {
  const { activeOfficer } = useLeoState();
  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { state, execute } = useFetch();
  const { openModal } = useModal();
  const { PANIC_BUTTON } = useFeatureEnabled();

  async function handlePanic() {
    if (!activeOfficer) return;

    await execute<PostLeoTogglePanicButtonData>({
      path: "/leo/panic-button",
      method: "POST",
      data: { officerId: activeOfficer.id },
    });
  }

  const isButtonDisabled =
    !activeOfficer ||
    activeOfficer.status?.shouldDo === ShouldDoType.SET_OFF_DUTY ||
    activeOfficer.statusId === null;

  const name =
    !isButtonDisabled &&
    (isUnitCombined(activeOfficer)
      ? generateCallsign(activeOfficer, "pairedUnitTemplate")
      : `${generateCallsign(activeOfficer)} ${makeUnitName(activeOfficer)}`);

  return (
    <div className="py-2">
      {!isButtonDisabled ? (
        <p className="text-lg">
          <span className="font-semibold">{t("Leo.activeOfficer")}: </span>
          {name}
        </p>
      ) : null}

      <div className="mt-2 modal-buttons-grid">
        {buttons.map((button, idx) => {
          return (
            <ModalButton
              disabled={isButtonDisabled}
              title={isButtonDisabled ? "Go on-duty before continuing" : undefined}
              key={idx}
              button={button}
              unit={activeOfficer}
            />
          );
        })}

        {PANIC_BUTTON ? (
          <Button
            id="panicButton"
            disabled={state === "loading" || isButtonDisabled}
            title={isButtonDisabled ? "Go on-duty before continuing" : t("Leo.panicButton")}
            onClick={handlePanic}
          >
            {t("Leo.panicButton")}
          </Button>
        ) : null}

        {!hasActiveDispatchers ? (
          <>
            <Button disabled={isButtonDisabled} onClick={() => openModal(ModalIds.Tones)}>
              {t("Leo.tones")}
            </Button>
            <TonesModal types={["leo"]} />
          </>
        ) : null}
      </div>
    </div>
  );
}
