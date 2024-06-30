import React, { useEffect } from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

const Timeline = ({ steps = [], handleSliderChange, index }) => {
  const [activeStep, setActiveStep] = React.useState(0);
  console.log(index);
  const handleStepClick = (index, timeDuration) => {
    setActiveStep(index);
    handleSliderChange(timeDuration);
  };
  const handleChangeTimeLine = (index) => {
    setActiveStep(index);
  };
  useEffect(() => {
    setActiveStep(index);
  }, [index]);

  return (
    <div>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step
            key={step.label}
            onClick={() => handleStepClick(index, step.timeDuration)}
          >
            <StepLabel>
              {step.label}
              <br />
              {step.timeDuration}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography>All steps completed - you&apos;re finished</Typography>
        </Paper>
      )}
    </div>
  );
};

export default Timeline;
