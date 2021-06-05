import { Box, Link, Typography } from "@material-ui/core";
import React, { Fragment, useState } from "react";
import { countryCodeToName } from "../data/countries";
import { ageRanges, LATEST_WAVE, WAVE_TO_YEAR } from "../data/legend";
import { useAppDispatch, useAppSelector } from "../hooks";
import { ValuesQuery, ValuesMap, ObservationDemographics, getReadableDescriptionForDemographic, getReadableDescriptionForGroupValue, groupsForDemographic, Value, ObservationDemographicsList, getReadableGroupDescriptor } from "../observation";
import { OnboardingStepTypes } from "../onboarding";
import { isLimitedWidthSelector, countryNameAppSelector, countryCodeAppSelector, getCountryCode, availableWavesForValueAndCountrySelector, availableWavesForValueAndCountry } from "../selectors";
import { updateValuesQuery, nextOnboardingStep, setPrimaryFilterDemographic, setCurrentColumn, setCurrentRow, updateObservationsQuery, setWave, setSecondaryFilterDemographic, updateUserPreferences, StoreState, skipOnboarding } from "../store";
import { colorGradientListCSS } from "./colors";
import { SimpleHeaderTitle, NextHeaderPrompt, FullTitle, TitleSelector } from "./header";
import { CountrySelect, ValuesView } from "./select";
import { Button, FadeInBox, FadeInBoxWithDelay, isLimitedWidth } from "./ui_utils";
import YouMarker from "./you_marker";

// utils
function createDemoButtons(demo: ObservationDemographics[], currentDemo: ObservationDemographics, handleClick: (demo: ObservationDemographics) => void) {
    return demo.map((demographic: ObservationDemographics) => {
        let select = demographic == currentDemo;
        const label = getReadableDescriptionForDemographic(demographic);
        return <Button small select={select} label={label} onClick={() => handleClick(demographic)} mr={1} key={`button-${demographic}`}></Button>
    });
}

/// CONTENT

interface StoryContent {
    header: () => void;
    story?: () => void;
    beforeReducer?: (state: StoreState) => void;
    afterReducer?: (state: StoreState) => void;
    primaryDemographic?: ObservationDemographics;
    secondaryDemographic?: ObservationDemographics;
    zoomedIn?: boolean;
    storyPosition?: 'top' | 'bottom';
    hideNextButton?: boolean;
    countryCode?: string;
    useSelectedValue?: boolean;
    useSelectedCountry?: boolean;
}

export const StoryContents: { [id: string]: StoryContent } = {
    // /**
    //  * select country
    //  */
    [OnboardingStepTypes.SELECT_COUNTRY]: {
        storyPosition: 'top',
        hideNextButton: true,
        header: () => {
            return (
                <Fragment>
                    <SimpleHeaderTitle>
                        Prejudice Free.
                    </SimpleHeaderTitle>
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            return (
                <Box>
                    <Box >
                        <Typography variant='h4'>
                            Are you free to form your own beliefs?
                        </Typography>
                    </Box>

                    <Box  mt={2}>
                        <Typography variant='h4'>
                            Over the past 5 years, 120,000 people were interviewed around the world about their opinions and values as part of the <i>World Values Survey</i>.
                    </Typography>
                    </Box>

                    <Box mt={2}>
                        <Typography variant='h4'>
                            This website will take you through a short data-driven journey to show you how some socio-demographic factors,
                            often outside our control, might affect how people around you think.
                    </Typography>
                    </Box>

                    <Box >
                        <NextHeaderPrompt>
                            <Typography variant='h4' display='inline'> Select your country{' '} </Typography>
                            <CountrySelect setPreferences ml={1} mr={1} mb={1} height={'2.7rem'} />
                            <Typography variant='h4' display='inline'>  {' '}and click next.{' '} </Typography>
                        </NextHeaderPrompt>
                    </Box>

                    <Box mt={4}>

                        <Typography variant='h4'>
                            At any time you can click on "                    


                            <Box mt={4} display='inline-block' ml={0.5} mr={0.5}>
                                <Typography variant='h3'> <Link color='inherit' href='#' onClick={() => dispatch(skipOnboarding())}> ► Skip the intro </Link> </Typography>
                            </Box>
                            " to skip this presentation and explore the full dataset. 
                        </Typography>
                    </Box>

                </Box>
            );
        },
        afterReducer: (state: StoreState) => {
            state.userPreferences.userCountry = getCountryCode(state)
        }
    },

    // /**
    //  * select value
    //  */
    [OnboardingStepTypes.SELECT_VALUE]: {
        storyPosition: 'top',
        hideNextButton: true,
        header: () => {
            return (
                <Fragment>
                    <SimpleHeaderTitle>
                        Select a topic.
                    </SimpleHeaderTitle>
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const onValuesSubmit = (query: ValuesQuery) => {
                dispatch(updateUserPreferences({ userValue: query.selectedValue }));
                dispatch(updateValuesQuery(query));
                dispatch(nextOnboardingStep());
            }
            const limitedWidth = isLimitedWidthSelector();
            const [uiSelectedValue, setUiSelectedValue] = useState(null);
            return (
                <Fragment>
                    {limitedWidth && uiSelectedValue ? null : (
                        <Fragment>
                            <Typography variant='h4'>
                                For now, let's focus on how your country accepts homosexuality or abortion.
                                Both are divisive or controversial topics in most countries around the world.
                                Pick which one you'd like to dive in.
                        </Typography>
                        </Fragment>
                    )}
                    <Box display='flex' flexDirection={limitedWidth ? 'column' : 'row'} width='100%' mt={4} minHeight={'400px'}>
                        <ValuesView visibleValues={['justify_abortion', 'justify_homosexuality']} onSubmit={onValuesSubmit} onSelect={(v) => setUiSelectedValue(v)} />
                    </Box>
                </Fragment>
            );
        }
    },

    // /*
    //  * Viz random
    //  */
    [OnboardingStepTypes.VIZ_RANDOM]: {
        useSelectedCountry: true,
        useSelectedValue: true,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const selectedValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const vLabel = ValuesMap[selectedValue];
            const countryName = countryNameAppSelector();
            return (
                <Fragment>

                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={500}>
                        <Typography variant='h4'>
                            People that answered the survey in {countryName} hold different opinions on {vLabel}. <br />
                            They are colored <span style={{ color: colorGradientListCSS(2) }}>{' '}●{' '}</span>blue if they answered that
                            they justify {vLabel} 7 or more, <span style={{ color: colorGradientListCSS(0) }}>{' '}●{' '}</span>red if they answered 4 or less,
                            <span style={{ color: colorGradientListCSS(1) }}>{' '}●{' '}</span>gray the rest. <br />
                        </Typography>
                    </FadeInBoxWithDelay>
                </Fragment>
            );
        }
    },

    /*
    * Viz one group
    */
    [OnboardingStepTypes.VIZ_ONE_GROUP]: {
        useSelectedCountry: true,
        useSelectedValue: true,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const limitedWidth = isLimitedWidthSelector();
            const aboutYou = limitedWidth ? `Tap on "show stats about you" to see` : `The "About you" section on the right displays information about`
            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={1000}>
                        <Typography variant='h4'>
                            The chart shows people are now sorted according to their answers. <br />
                            {/* Where do you stand? You are marked with "<YouMarker />", and placed close to people that thinks similarly to you. */}
                            Where do you stand? You are the figure painted in yellow, and you are close to people that think similarly to you..
                    </Typography>
                    </FadeInBoxWithDelay>
                    <FadeInBoxWithDelay fadeInAfter={2000} mt={1}>
                        <Typography variant='h4'>
                            {aboutYou} where you stand compared to the people in the chart.
                        </Typography>
                    </FadeInBoxWithDelay>
                </Fragment>
            );
        },
        primaryDemographic: null,
        secondaryDemographic: null,
    },

    /*
    * Viz zoomed in
    */
    [OnboardingStepTypes.ZOOM_IN]: {
        useSelectedCountry: true,
        useSelectedValue: true,
        zoomedIn: true,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const limitedWidth = isLimitedWidthSelector();
            const clickOrTap = limitedWidth ? 'tap' : 'click';
            const hoverOrTap = limitedWidth ? 'tap on' : 'hover over';
            const countryName = countryNameAppSelector();
            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={3000}>
                        <Typography variant='h4'>
                            The figures you see on the screen are all people the answered the survey in {countryName}
                        </Typography>
                        <Box mt={1}>
                            <Typography variant='h4'>
                                At any point, you can {clickOrTap} on the chart to zoom in. <br />
                                When the chart is zoomed in, you can {hoverOrTap} them and read a bit about their answers.
                            </Typography>
                        </Box>
                    </FadeInBoxWithDelay>
                </Fragment>
            );
        },
    },

    /*
    * Viz age split
    */
    [OnboardingStepTypes.VIZ_AGE_SPLIT]: {
        useSelectedCountry: true,
        useSelectedValue: true,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const groups = groupsForDemographic('age');
            const currentColumn = useAppSelector(state => {
                return state.rawData.currentColumn;
            });
            const currentDemo = useAppSelector(state => {
                return state.rawData.primaryFilterDemographic;
            });
            const ageButtons = groups.map((_, i) => {
                let select = i == currentColumn && !!currentDemo;
                const handleClick = () => {
                    if (currentDemo != 'age') {
                        dispatch(setPrimaryFilterDemographic({ demographic: 'age' }));
                    }
                    dispatch(setCurrentColumn({ column: i }));
                }
                const label = getReadableDescriptionForGroupValue('age', i);
                return <Button small select={select} label={label} onClick={handleClick} mr={1} key={`button-${i}`}></Button>
            });
            const countryName = countryNameAppSelector();
            const selectedValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const vLabel = ValuesMap[selectedValue];
            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={3000}>
                        <Typography variant='h4'>
                            What's your age?
                        </Typography>
                        <Box display='flex' mt={1}>
                            {ageButtons}
                        </Box>
                    </FadeInBoxWithDelay>
                    <FadeInBox visible={currentDemo == 'age'}>
                        <Typography variant='h4'>
                            You might not be surprised to see that younger people have expressed more tolerant views on {vLabel}.
                            But is this trend widespread around the world? And is it present in other topics?
                        </Typography>
                    </FadeInBox>
                </Fragment>
            );
        },
        primaryDemographic: null,
        secondaryDemographic: null,
    },

    [OnboardingStepTypes.OTHER_COUNTRIES_AND_VALUES]: {
        useSelectedCountry: true,
        useSelectedValue: true,
        primaryDemographic: null,
        secondaryDemographic: null,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const currentValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const currentCountryCode = countryCodeAppSelector();
            const [step, setStep] = useState(0);

            const valueButton = (v: Value) => {
                return (
                    <Button label={ValuesMap[v]} small
                        select={v == currentValue}
                        onClick={() => {
                            dispatch(updateValuesQuery({ selectedValue: v }))
                            if (step == 0) {
                                setStep(1);
                            }
                        }} />
                );
            }
            const currentDemo = useAppSelector(state => {
                return state.rawData.primaryFilterDemographic;
            });

            const countryButton = (code: string) => {
                return (
                    <Button mr={1} label={countryCodeToName[code]} small
                        select={code == currentCountryCode}
                        key={`button-${code}`}
                        onClick={() => {
                            dispatch(updateObservationsQuery({ country_codes: [code] }))
                        }} />
                );
            }

            const splitByAge = < Button small select={currentDemo == 'age'} label={'Split by age'}
                onClick={() => {
                    dispatch(setPrimaryFilterDemographic({ demographic: 'age' }))
                    setStep(2);
                }} mr={1} />;
            const noSplit = < Button small select={currentDemo == null} label={'All together'}
                onClick={() => {
                    dispatch(setPrimaryFilterDemographic({ demographic: null }))
                    setStep(2);
                }} mr={1} />;

            const countries = ['840', '752', '484', '380', '392'].map(countryButton);

            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={3000}>
                        <Box>
                            <Typography variant='h4'> Look at how your country answered on the following topics: </Typography>
                        </Box>
                        <Box display='flex' mt={1}>
                            <Box mr={1}>{valueButton('justify_abortion')}</Box>
                            <Box mr={1}>{valueButton('justify_homosexuality')}</Box>
                            <Box mr={1}>{valueButton('justify_casual_sex')}</Box>
                            <Box mr={1}>{valueButton('justify_divorce')}</Box>
                        </Box>

                        <FadeInBox mt={1} visible={step > 0}>
                            <Typography variant='h4'>
                                Look at how the results differ by age:
                            </Typography>
                            <Box display='flex' mt={1}>
                                {noSplit}
                                {splitByAge}
                            </Box>
                        </FadeInBox>

                        <FadeInBox mt={1} visible={step > 1}>
                            <Typography variant='h4'>
                                Explore how people think in different countries. Do you see the same pattern?
                            </Typography>
                            <Box display='flex' mt={1} mb={1}>{countries}</Box>
                        </FadeInBox>

                    </FadeInBoxWithDelay>
                </Fragment>
            );
        },
    },

    [OnboardingStepTypes.COMMENT_ON_FREEDOMS]: {
        useSelectedCountry: true,
        useSelectedValue: true,
        primaryDemographic: 'age',
        // primaryDemographic: null,
        // secondaryDemographic: null,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const currentValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const currentCountryCode = countryCodeAppSelector();
            const [step, useStep] = useState(0);

            const valueButton = (v: Value) => {
                return (
                    <Button label={ValuesMap[v]} small
                        select={v == currentValue}
                        onClick={() => {
                            dispatch(updateValuesQuery({ selectedValue: v }))
                            useStep(1);
                        }} />
                );
            }
            const currentDemo = useAppSelector(state => {
                return state.rawData.primaryFilterDemographic;
            });

            const countryButton = (code: string) => {
                return (
                    <Button mr={1} label={countryCodeToName[code]} small
                        select={code == currentCountryCode}
                        key={`button-${code}`}
                        onClick={() => {
                            dispatch(updateObservationsQuery({ country_codes: [code] }))
                            useStep(2);
                        }} />
                );
            }

            const splitByAge = < Button small select={currentDemo == 'age'} label={'Split by age'}
                onClick={() => dispatch(setPrimaryFilterDemographic({ demographic: 'age' }))} mr={1} />;
            const noSplit = < Button small select={currentDemo == null} label={'All together'}
                onClick={() => dispatch(setPrimaryFilterDemographic({ demographic: null }))} mr={1} />;

            const countries = ['840', '752', '484', '380', '392'].map(countryButton);

            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={1000}>
                        <Box>
                            <Typography variant='h4'> 
                                We see a clear pattern emerging in most countries: younger people are more likely to be support homosexuality,
                                abortion, having casual sex, divorce, more than older generations.
                                
                            </Typography>
                        </Box>
                        <Box mt={1}>
                            <Typography variant='h4'>
                                {/* Another way to say it is that younger people value more individual freedom. <br /> */}
                                What can the data of this survey tell us about when did this trend start? 
                                And, is it true that people become more conservative as they age? 
                            </Typography>
                        </Box>
                    
                    </FadeInBoxWithDelay>
                </Fragment>
            );
        },
    },

    /* time travel */
    [OnboardingStepTypes.TIME_TRAVEL]: {
        primaryDemographic: 'age',
        secondaryDemographic: null,
        useSelectedValue: true,
        useSelectedCountry: true,
        beforeReducer: (state) => {
            // fallback on the USA if no previous data is available
            if (availableWavesForValueAndCountry(state).length < 3) {
                state.filterQuery.country_codes = ['840'];
            }
        },
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const [uiWave, setUIWave] = useState(null);
            const currentValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const currentWave = useAppSelector(state => {
                return state.rawData.wave
            });
            const currentCountryCode = countryCodeAppSelector();
            const countryName = countryNameAppSelector();
            const selectedValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const availableWaves = availableWavesForValueAndCountrySelector();
            const wavesToDisplay = [];
            wavesToDisplay.push(LATEST_WAVE);
            if (availableWaves.indexOf('wvs_3') != -1) {
                wavesToDisplay.push('wvs_3');
            }
            if (availableWaves.indexOf('evs_3') != -1) {
                wavesToDisplay.push('evs_3');
            }
            if (availableWaves.indexOf('wvs_1') != -1) {
                wavesToDisplay.push('wvs_1');
            }
            if (availableWaves.indexOf('evs_1') != -1) {
                wavesToDisplay.push('evs_1');
            }

            const waveButtons = wavesToDisplay.map(w => {
                const label = w == LATEST_WAVE ? 'Now' : (new Date().getFullYear() - WAVE_TO_YEAR[w]) + ' years ago';
                return <Button 
                    mr={1}
                    label={label} small
                    select={currentWave == w}
                    key={`wave-button-${w}`}
                    onClick={() => handleSetWave(w)} />;
            })
            const vLabel = ValuesMap[selectedValue];
            const handleSetWave = (wave: string) => {
                dispatch(setWave({ wave }))
                setUIWave(wave);
            }

            return (
                <Fragment>
                    <FadeInBoxWithDelay fadeInAfter={3000}>
                        <Typography variant='h4'>
                            We can compare today's data with the data from previous interviews.  <br />
                            The survey has been going on for almost 40 years, which gives us 
                            enough data to draw a picture of how opinion changed over time. <br />
                        </Typography>
                    </FadeInBoxWithDelay>

                    <FadeInBoxWithDelay fadeInAfter={3000} mt={1}>
                        <Typography variant='h4'>
                            Let's look at the survey results for {countryName} on {vLabel}.
                            The chart is grouping people by year of birth, which allows us to see the evolution of 
                            the opinion.
                        </Typography>
                    </FadeInBoxWithDelay>
                    <FadeInBoxWithDelay fadeInAfter={3000}>

                        <Box display='flex' mt={1} mb={1}>
                            {waveButtons}
                        </Box>
                    </FadeInBoxWithDelay>
                    <FadeInBox visible={!!uiWave || currentWave != LATEST_WAVE}>
                        <Typography variant='h4'>

                            {/* Predictably, we have more people born before {ageRanges[2][0]}. */}
                            None of the age groups have become more conservative as they age.
                            <br></br>
                            The age group born between {ageRanges[1][0]} and {ageRanges[1][1]} has always been more tolerant than those
                            born before {ageRanges[2][1]}. Likewise, the people born between {ageRanges[0][0]} and {ageRanges[0][1]},
                            as they start showing up in the data, are more tolerant than older generations.
                             <br></br>
                            Why is this happening?
                        </Typography>
                    </FadeInBox>
                </Fragment>
            );
        },
    },

    /* the ladder of freedom */
    [OnboardingStepTypes.THE_LADDER_OF_FREEDOM]: {
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={1000}>
                        <Typography variant='h4'>
                            One way to explain this trend is to consider at the overall economical growth that most of the world has seen post World War II.
                            New generations are less worried about economical and political issues, and this feeling of stability and security 
                            fuels open-minded, tolerant opinions.
                        </Typography>
                    </FadeInBoxWithDelay>
                    <FadeInBoxWithDelay fadeInAfter={1500} mt={1}>
                        <Typography variant='h4'>
                            But older people tend to be slower to adapt their views to the current times. 
                            The socio-economical conditions you experienced while living through the last years of your adolescence 
                            are crucial in forming views on political and social issues. 
                            Once you become an adult, you are not likely to significantly change your opinion for the rest of your life.
                        </Typography>
                    </FadeInBoxWithDelay>
                    <FadeInBoxWithDelay fadeInAfter={2500} mt={1}>
                        <Typography variant='h4'>
                            If we accept this theory as true, how do we expect people's opinion to differ according to their education or income?
                        </Typography>
                    </FadeInBoxWithDelay>

                </Fragment>
            );
        },
        secondaryDemographic: null,
        useSelectedValue: true,
    },

    /* other factors */
    [OnboardingStepTypes.OTHER_FACTORS]: {
        useSelectedCountry: true,
        secondaryDemographic: null,
        useSelectedValue: true,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const [uiDemo, setUIDemo] = useState(null);
            const currentDemo = useAppSelector(state => {
                return state.rawData.primaryFilterDemographic;
            });
            const filterButtons = createDemoButtons(['age', 'education', 'income'], currentDemo, (demographic: ObservationDemographics) => {
                dispatch(setPrimaryFilterDemographic({ demographic }));
                setUIDemo(demographic)
            });
            const selectedValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const vLabel = ValuesMap[selectedValue];
            const currentCountryCode = countryCodeAppSelector();
            const countryName = countryCodeToName[currentCountryCode];

         
            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={3000}>
                        <Typography variant='h4'>
                            Let's look at how the opinion on {vLabel} in {countryName} changes when we group the data by one of these demographics:
                        </Typography>
                        <Box display='flex' mt={1} mb={1}>
                            {filterButtons}
                        </Box>

                        <FadeInBox visible={!!uiDemo}>
                            <Typography variant='h4'>
                                High income and education are generally associated with a lifestyle that makes you less worried about your "survival", 
                                and lets you see life as a source of opportunity rather than as a source of stress.
                                Consequently, higher income and education groups are more often associated with more open-minded views.
                            </Typography>
                        </FadeInBox>
                    </FadeInBoxWithDelay>
                </Fragment>
            );
        },
    },


    /*
    * Religion
    */
    [OnboardingStepTypes.RELIGION]: {
        useSelectedCountry: true,
        primaryDemographic: null,
        secondaryDemographic: null,
        useSelectedValue: true,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const groups = groupsForDemographic('religiosity');
            const currentRow = useAppSelector(state => {
                return state.rawData.currentRow;
            });
            const currentColumn = useAppSelector(state => {
                return state.rawData.currentColumn;
            });
            const currentPrimaryDemo = useAppSelector(state => {
                return state.rawData.primaryFilterDemographic;
            });
            const currentSecondaryDemo = useAppSelector(state => {
                return state.rawData.secondaryFilterDemographic;
            });
            const readablePrimaryDemo = getReadableDescriptionForDemographic(currentPrimaryDemo);
            const readableSecondaryDemo = getReadableDescriptionForDemographic(currentSecondaryDemo);

            const religionButtons = groups.map((_, i) => {
                let select = i == currentColumn && currentPrimaryDemo == 'religiosity';
                const handleClick = () => {
                    if (currentPrimaryDemo != 'religiosity') {
                        dispatch(setPrimaryFilterDemographic({ demographic: 'religiosity' }));
                    }
                    dispatch(setCurrentColumn({ column: i }));
                }
                const label = getReadableDescriptionForGroupValue('religiosity', i);
                return <Button small select={select} label={label} onClick={handleClick} mr={1} key={`button-${i}`}></Button>
            });

            const countryName = countryNameAppSelector();
            const selectedValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const vLabel = ValuesMap[selectedValue];
;

            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={1000}>
                        <Typography variant='h4'>
                            However, age, income, and education are not the only factors affecting our beliefs.
                            For example, religion also has an impact on our personal views. <br/>
                            Select below if you consider yourself religious or not, and let's see if your opinion on {vLabel} is more or less
                            common among those who have a similar faith.
                        </Typography>
                        <Box display='flex' mt={1}>
                            {religionButtons}
                        </Box>
                    </FadeInBoxWithDelay>
                    <FadeInBox visible={currentPrimaryDemo == 'religiosity'} mt={1}>
                        <Typography variant='h4'>
                            The chart is showing you the data broken down by {readablePrimaryDemo}. <br/>
                            But this alone does not tell us if religion makes people's opinions more conservative, or if religious people are on average older, or less educated, 
                            or from lower income families.
                        </Typography>
                    </FadeInBox>
                </Fragment>
            );
        },
    },

    /*
  * Religion
  */
    [OnboardingStepTypes.RELIGION_CONTROL_VARIABLES]: {
        useSelectedCountry: true,
        primaryDemographic: 'religiosity',
        secondaryDemographic: null,
        useSelectedValue: true,
        header: () => {
            return (
                <Fragment>
                    <TitleSelector />
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const currentPrimaryDemo = useAppSelector(state => {
                return state.rawData.primaryFilterDemographic;
            });
            const currentSecondaryDemo = useAppSelector(state => {
                return state.rawData.secondaryFilterDemographic;
            });
            const readableSecondaryDemo = getReadableDescriptionForDemographic(currentSecondaryDemo);

            const selectedValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const vLabel = ValuesMap[selectedValue];

            const filterButtons = createDemoButtons(['age', 'income', 'education'], currentSecondaryDemo, (demographic: ObservationDemographics) => {
                dispatch(setSecondaryFilterDemographic({ demographic }));
            });

            const limitedWidth = isLimitedWidthSelector();
            const arrowPlacementDesc = limitedWidth ? 'on top of' : 'on the left of';

            let groupDesc = readableSecondaryDemo;
            if (currentSecondaryDemo == 'education') {
                groupDesc = 'with the same level of education'
            } else if (currentSecondaryDemo == 'age') {
                groupDesc = 'in the same age group'
            } else if (currentSecondaryDemo == 'income') {
                groupDesc = 'from the same income bracket'
            }

            return (
                <Fragment>
                    <FadeInBox visible={currentPrimaryDemo == 'religiosity'} mt={1}>
                        <Typography variant='h4'>
                            However, we can <i>control</i> for these variables by filtering only the people within the same demographic group:
                        </Typography>
                        <Box display='flex' mt={1}>
                            {filterButtons}
                        </Box>
                    </FadeInBox>
                    <FadeInBox visible={!!currentSecondaryDemo} mt={1}>
                        <Typography variant='h4'>
                            The chart shows people {groupDesc}, split by their religiosity. <br />
                            Use the up and down arrow {arrowPlacementDesc} the chart to move across different groups. <br />
                        </Typography>
                    </FadeInBox>
                </Fragment>
            );
        },
    },

    /*
    * End message
    */
    [OnboardingStepTypes.END_MESSAGE]: {
        useSelectedCountry: true,
        primaryDemographic: null,
        secondaryDemographic: null,
        beforeReducer: (state: StoreState) => {
            state.wave = LATEST_WAVE;
        },
        header: () => {
            return (
                <Fragment>
                    {/* <FullTitle /> */}
                    <TitleSelector primaryDemographic secondaryDemographic />
                </Fragment>
            );
        },
        story: () => {
            const dispatch = useAppDispatch();
            const groups = groupsForDemographic('religiosity');
            const currentRow = useAppSelector(state => {
                return state.rawData.currentRow;
            });
            const currentSecondaryDemo = useAppSelector(state => {
                return state.rawData.secondaryFilterDemographic;
            });
            const religionButtons = groups.map((_, i) => {
                let select = i == currentRow && !!currentSecondaryDemo;
                const handleClick = () => {
                    if (currentSecondaryDemo != 'religiosity') {
                        dispatch(setSecondaryFilterDemographic({ demographic: 'religiosity' }));
                    }
                    dispatch(setCurrentRow({ row: i }));
                }
                const label = getReadableDescriptionForGroupValue('religiosity', i);
                return <Button small select={select} label={label} onClick={handleClick} mr={1} key={`button-${i}`}></Button>
            });
            const countryName = countryNameAppSelector();
            const selectedValue = useAppSelector(state => {
                return state.rawData.valuesQuery.selectedValue;
            });
            const vLabel = ValuesMap[selectedValue];

            return (
                <Fragment>
                    {/* description */}
                    <FadeInBoxWithDelay fadeInAfter={3000}>
                        <Typography variant='h4'>
                            That was it! <br />
                            You should now be able to navigate through this website and explore the data by yourself.
                            There are more interesting questions such as acceptance of casual sex, suicide, death penalty, and more
                            criteria to split and filter the population by.
                        </Typography>
                        <Box display='flex' mt={1}>
                            <Typography variant='h4'>
                                Do you have any feedback for this website? Send me an email at hi@prejudicefree.com
                            </Typography>
                        </Box>
                    </FadeInBoxWithDelay>
                </Fragment>
            );
        },
    },


    /*
    * select demo x
    */
    // [OnboardingStepTypes.SELECT_DEMO_X]: () => {
    //     const dispatch = useAppDispatch();
    //     const onDemoSubmit = (demographic: ObservationDemographics) => {
    //         dispatch(setPrimaryFilterDemographic({ demographic }));
    //         dispatch(nextOnboardingStep());
    //     }
    //     return (
    //         <Fragment>
    //             <SimpleHeaderTitle>
    //                 Select a demographic.
    //             </SimpleHeaderTitle>

    //             <FadeInBoxWithDelay fadeInAfter={500}>
    //                 <Typography variant='h4'>
    //                     Now let’s make things more interesting.
    //                     I listed below some characteristics we can split the population by. Select one of them
    //                     and see how people's opinions change within each group.
    //                 </Typography>
    //             </FadeInBoxWithDelay>

    //             <FadeInBoxWithDelay fadeInAfter={4000}>
    //                 <Box display='flex' flexDirection='row' width='100%' mt={4}>
    //                     <DemographicView axis='x' onSubmit={onDemoSubmit} />
    //                 </Box>
    //             </FadeInBoxWithDelay>
    //         </Fragment>
    //     );
    // },
    // [OnboardingStepTypes.SELECT_ADDITIONAL_DEMO_X]: {
    //     header: () => {
    //         return (
    //             <Fragment>
    //                 <TitleSelector primaryDemographic />
    //             </Fragment>
    //         );
    //     },
    //     story: () => {
    //         const dispatch = useAppDispatch();
    //         const selectedDemographic = useAppSelector(state => {
    //             return state.rawData.primaryFilterDemographic;
    //         })
    //         const demoButtons = ['age', 'income', 'education'].map((v: ObservationDemographics) => {
    //             const label = getReadableDescriptionForDemographic(v);
    //             const select = selectedDemographic == v;
    //             const onDemoSubmit = () => {
    //                 dispatch(setPrimaryFilterDemographic({ demographic: v }));
    //             }
    //             return (
    //                 <Box key={v} >
    //                     <Button small label={label} select={select} onClick={onDemoSubmit} mr={1}> </Button>
    //                 </Box>
    //             );
    //         });
    //         return (
    //             <Fragment>
    //                 {/* <SimpleHeaderTitle>
    //                     Select a demographic.
    //                 </SimpleHeaderTitle> */}

    //                 <FadeInBoxWithDelay fadeInAfter={500}>
    //                     <Typography variant='h4'>
    //                         Now let’s make things more interesting.
    //                         I listed below some characteristics we can split the population by. Select one of them
    //                         and see how people's opinions change within each group.
    //                     </Typography>
    //                 </FadeInBoxWithDelay>

    //                 <FadeInBoxWithDelay fadeInAfter={4000}>
    //                     <Box display='flex' flexDirection='row' width='100%' mt={1} flexWrap='wrap'>
    //                         {demoButtons}
    //                     </Box>
    //                 </FadeInBoxWithDelay>

    //                 <FadeInBoxWithDelay fadeInAfter={500} mt={2}>
    //                     <Typography variant='h4'>
    //                         Now, bla bla bla
    //                     </Typography>
    //                 </FadeInBoxWithDelay>
    //             </Fragment>
    //         );
    //     }
    // },
    //

    // /*
    // * visualize demo x
    // */
    // [OnboardingStepTypes.VIZ_DEMO_X]: () => {
    //     const limitedWidth = isLimitedWidthSelector();
    //     const onboardingMessageStep = useAppSelector(state => state.rawData.currentOnboardingMessageStepIndex);
    //     return (
    //         <Fragment>
    //             <TitleSelector primaryDemographic />

    //             {onboardingMessageStep == null || limitedWidth ?
    //                 <FadeInBoxWithDelay fadeInAfter={4000}>
    //                     <NextHeaderPrompt>
    //                         <Typography variant='h4' display='inline' >
    //                             Feel free to play with the filters above.
    //                             When you’re ready to take it to the next level, click next.
    //                 </Typography>
    //                     </NextHeaderPrompt>
    //                 </FadeInBoxWithDelay> : null}
    //         </Fragment>
    //     );
    // },

    // /*
    // * select demo y
    // */
    // [OnboardingStepTypes.SELECT_DEMO_Y]: () => {
    //     const dispatch = useAppDispatch();
    //     const onDemoSubmit = (demographic: ObservationDemographics) => {
    //         dispatch(setSecondaryFilterDemographic({ demographic }));
    //         dispatch(nextOnboardingStep());
    //     }
    //     return (
    //         <Fragment>
    //             <SimpleHeaderTitle>
    //                 One more thing.
    //             </SimpleHeaderTitle>
    //             <Typography variant='h4'>
    //                 Let’s make things a bit more complicated. Pick one more characteristic to break down the population by.
    //             </Typography>

    //             <Box display='flex' flexDirection='row' width='100%' mt={4}>
    //                 <DemographicView axis='y' onSubmit={onDemoSubmit} />
    //             </Box>
    //         </Fragment>
    //     );
    // },


    // /*
    // * visualize demo y
    // */
    // [OnboardingStepTypes.VIZ_DEMO_Y]: () => {
    //     const limitedWidth = isLimitedWidthSelector();
    //     const onboardingMessageStep = useAppSelector(state => state.rawData.currentOnboardingMessageStepIndex);
    //     // for now, same as full viz
    //     return (
    //         <Fragment>
    //             <FullTitle />
    //             {onboardingMessageStep == null || limitedWidth &&
    //                 <FadeInBoxWithDelay fadeInAfter={4000} mt={2}>
    //                     <NextHeaderPrompt nextLabel='Got it'>
    //                         <Typography variant='h4' display='inline' >
    //                             You made it to the end. Try to change country, topic, demographics and understand how your opinion compares to others.
    //                 </Typography>
    //                     </NextHeaderPrompt>
    //                 </FadeInBoxWithDelay>
    //             }
    //         </Fragment>
    //     );
    // },

    /**
     * Full Viz 
     */
    [OnboardingStepTypes.COMPLETE_VIZ]: {
        hideNextButton: true,
        header: () => {
            const currentPrimaryDemo = useAppSelector(state => {
                return state.rawData.primaryFilterDemographic;
            });
            return (
                <TitleSelector primaryDemographic secondaryDemographic={!!currentPrimaryDemo} center />
            );
        },
    }
}


