import React, { Fragment, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import { ThemeProvider } from '@material-ui/styles';
import theme from './theme';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, InputLabel, MenuItem, Select, Switch, Accordion, AccordionDetails, AccordionSummary } from '@material-ui/core';
import { countryCodeToName } from '../data/countries';
import { educationLevels, educationRanges, getIndexFromRange} from '../data/legend';
import { useAppSelector } from '../hooks';
import * as format from "d3-format";
import { AltStatsAndQuery, StatsAccumulator } from '../observation';
import { formatPercent } from '../data/format';

const useStyles = makeStyles((theme) => ({
  root: {
    width: 400,
  },
  margin: {
    height: theme.spacing(3),
  },
}));

function educationValueText(value: number): string {
  return educationLevels[value];
}

// const selectStats = createSelector(
//   state => state.,
//   (_, completed) => completed,
//   (todos, completed) =>
//     todos.filter(todo => todo.completed === completed).length
// )

const renderAltText = (originalPerc: number, altPercent: number, altStat: AltStatsAndQuery) => {
  const positiveAnswerDecreased = originalPerc > 0.6 && altPercent < originalPerc;
  const negativeAnswerIncreased = originalPerc < 0.4 && altPercent > originalPerc;
  // const divisiveAnswerIncreased = originalPerc > 0.6 && originalPerc < 0.4 && altPercent > originalPerc;

  const {whatChanged} = altStat.query;
  if (whatChanged.variable == 'is_religious' && whatChanged.to == true) {
      if (negativeAnswerIncreased) {
        return `If you were a religious person, ${formatPercent(altPercent)} will be against.`
      }
  }

  if (whatChanged.variable == 'education_parents') {
    let eduIndex: number;
    let moreOrLess: string;
    if (whatChanged.from > whatChanged.to) {
      eduIndex = educationRanges[whatChanged.to as number][1]; //max
      moreOrLess = 'less';
    } else {
      eduIndex = educationRanges[whatChanged.to as number][0]; //min
      moreOrLess = 'more';
    }
    const eduLevel = educationValueText(eduIndex);
    const start = `If your parents education level was ${eduLevel} or ${moreOrLess}`
    if (negativeAnswerIncreased) {
      return `${start}, ${formatPercent(altPercent)} will be against.`
    } else if (positiveAnswerDecreased) {
      return `${start}, ${formatPercent(1 - altPercent)} will be supportive.`
    }
  }
  
};

function renderBooleanStat(stats: StatsAccumulator, altStatsAndQueries: AltStatsAndQuery[], params: {
  statName: string,
  falseFlag: string, 
  trueFlag: string,
  notEnoughtDataLabel: string,
  trueLabel: string,
  falseLabel: string,
  divisiveLabel: string,
}) {
  const stat = stats[params.statName];
  const nTrue = stat[params.trueFlag];
  const nFalse = stat[params.falseFlag];
  if (nTrue == 0 && nFalse == 0) {
    return (
      <ResultGroup label={params.notEnoughtDataLabel} />
    );
  }

  const perc = nTrue / (nTrue + nFalse);

  // find alt stat
  let maxDelta = 0;
  let maxAltStatAndQuery: AltStatsAndQuery|null = null;
  let maxAltPercent: number = 0;
  altStatsAndQueries.forEach(altStatAndQuery => {
    const s = altStatAndQuery.stats[params.statName];
    s[params.trueFlag]
    const nT = s[params.trueFlag];
    const nF = s[params.falseFlag];
    if (nT != 0 || nF != 0) {
      const altPercent = nT / (nT + nF);
      const delta = Math.abs(perc - altPercent);
      if (maxDelta < delta) {
        maxDelta = delta;
        maxAltStatAndQuery = altStatAndQuery;
        maxAltPercent = altPercent;
      }
    }
  });
  if (maxAltStatAndQuery == null) {
    return 'maxAltStatAndQuery is null'
  }
  console.log(`${params.statName}: ${maxAltPercent} for ${maxAltStatAndQuery.query.whatChanged}`);

  //
  const altText = renderAltText(perc, maxAltPercent, maxAltStatAndQuery) || '';

  if (perc > 0.6) {
    return (
      <ResultGroup label={params.trueLabel}>
        <span>{formatPercent(perc)} is against. {altText} </span>
      </ResultGroup>
    );
  } else if (perc < 0.4) {
    return (
      <ResultGroup label={params.falseLabel}>
        <span>{formatPercent(1 - perc)} is supportive. {altText}</span>
      </ResultGroup>
    );
  } else {
    return (
      <ResultGroup label={params.divisiveLabel}>
        <span>{formatPercent(perc)} is against. {altText} </span>
      </ResultGroup>
    )
  }
}

export function Results() {
  const classes = useStyles();
  const filteredResults = useAppSelector(state =>
    state.rawData.filteredEntries.length
  );
  const filteredStats = useAppSelector(state =>
    state.rawData.filterStats
  );
  const altStatsAndQueries = useAppSelector(state =>
    state.rawData.altStatsAndQueries
  )

  const homoStat = renderBooleanStat(filteredStats, altStatsAndQueries, {
    statName: 'against_homo',
    falseFlag: 'false',
    trueFlag: 'true',
    notEnoughtDataLabel: 'Not enough data to estimate opinion on gay right in this social demographics. Adjust the filters and try again.',
    trueLabel: 'You are likely against gay rights or consider same-sex couples are not as good parents than heterosexual couples.',
    falseLabel: 'You likely tolerate or support gay rights in society.',
    divisiveLabel: 'Gay rights are a divisive topic in your social demographic.',
  }); 

  const abortionStat = renderBooleanStat(filteredStats, altStatsAndQueries, {
    statName: 'against_abortion',
    falseFlag: 'false',
    trueFlag: 'true',
    notEnoughtDataLabel: 'Not enough data to estimate opinion on abortion.',
    trueLabel: 'You are likely against abortion.',
    falseLabel: 'You likely support abortion as right in society.',
    divisiveLabel: 'Abortion is a divisive topic in your social demographic.',
  });
  
  const immigrantsStat = renderBooleanStat(filteredStats, altStatsAndQueries, {
    statName: 'against_immigrants',
    falseFlag: 'false',
    trueFlag: 'true',
    notEnoughtDataLabel: 'Not enough data to estimate opinion on immigrants.',
    trueLabel: 'You are likely against immigrants.',
    falseLabel: 'You likely ok with immigrants.',
    divisiveLabel: 'Immigration is a divisive topic in your social demographic.',
  });

  const trustStat = renderBooleanStat(filteredStats, altStatsAndQueries, {
    statName: 'people_can_be_trusted',
    falseFlag: 'false',
    trueFlag: 'true',
    notEnoughtDataLabel: 'Not enough data to estimate how much you trust people.',
    trueLabel: 'You are likely to trust people that you meet for the first time.',
    falseLabel: 'You likely mistrust people you meet the first time.',
    divisiveLabel: 'Seems that there\'s no strong tendency towards trusting or not trusting people in your demographic.',
  });

  return (
    <div className={classes.root}>
      {homoStat}
      {abortionStat}
      {immigrantsStat}
      {trustStat}
      <Box mt={1} p={2}>
        <Accordion>
          <AccordionSummary
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography variant='caption'>debug panel</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant='caption'>
              all stats: {filteredResults},
              dump {JSON.stringify(filteredStats, null, 2)}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </div>
  );
}

function ResultGroup(props: {label: string, children?: JSX.Element[] | JSX.Element}) {
  return(
    <Box mt={4}>
      <Typography gutterBottom variant="h6">
        ● {" "} {props.label}
      </Typography>
      {props.children}
    </Box>
  );
}
