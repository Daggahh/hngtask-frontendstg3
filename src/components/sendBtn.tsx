import { Send } from "lucide-react";
import React from "react";
import styled from "styled-components";

interface SendBtnProps {
  onClick: () => void;
}

const SendBtn: React.FC<SendBtnProps> = ({ onClick }) => {
  return (
    <StyledWrapper>
      <div className="flex items-center z-50 relative">
        <button
          className="button"
          onClick={onClick}
          aria-label="process text"
          role="button"
        >
          <Send />
        </button>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .button {
    --bezier: cubic-bezier(0.22, 0.61, 0.36, 1);
    --edge-light: hsla(0, 0%, 50%, 0.8);
    --text-light: rgba(255, 255, 255, 0.4);
    --back-color: 118, 6%;

    cursor: pointer;
    padding: 0.7em 1em;
    border-radius: 50%;
    height: 50px;
    width: 50px;
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin-left: 8px;
    font-weight: bold;

    background: linear-gradient(
      140deg,
      hsla(var(--back-color), 5%, 1) min(2em, 20%),
      hsla(var(--back-color), 5%, 0.6) min(8em, 100%)
    );
    color: hsla(0, 0%, 90%);
    border: 0;
    box-shadow: inset 0.4px 1px 4px var(--edge-light);

    transition: all 0.1s var(--bezier);

    .dark & {
      --back-color: 221, 40%;

      background: linear-gradient(
        140deg,
        hsla(var(--back-color), 5%, 1) min(2em, 20%),
        hsla(var(--back-color), 50%, 0.6) min(8em, 100%)
      );
    }
  }

  .button svg {
    width: 24px;
    height: 24px;
  }

  .button:hover {
    --edge-light: hsla(0, 0%, 50%, 1);
    text-shadow: 0px 0px 10px var(--text-light);
    box-shadow: inset 0.4px 1px 4px var(--edge-light),
      2px 4px 8px hsla(0, 0%, 0%, 0.295);
    transform: scale(1.1);
  }

  .button:active {
    --text-light: rgba(255, 255, 255, 1);

    background: linear-gradient(
      140deg,
      hsla(var(--back-color), 50%, 1) min(2em, 20%),
      hsla(var(--back-color), 50%, 0.6) min(8em, 100%)
    );
    box-shadow: inset 0.4px 1px 8px var(--edge-light),
      0px 0px 8px hsla(var(--back-color), 50%, 0.6);
    text-shadow: 0px 0px 20px var(--text-light);
    color: hsla(0, 0%, 100%, 1);
    letter-spacing: 0.1em;
    transform: scale(1);
  }
`;

export default SendBtn;
