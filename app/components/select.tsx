
import { Box, BoxProps, Typography } from '@material-ui/core'
import React, { Fragment, useState } from 'react';
import styles from '../../styles/select.module.css'
import { countryCodeToName } from '../data/countries';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, ObservationDemographics, ObservationDemographicsList, ValuesMap, ValuesQuery } from '../observation';
import { setPrimaryFilterDemographic, setSecondaryFilterDemographic, uiSetSelect, updateObservationsQuery, updateValuesQuery } from '../store';
import { Chevron } from './chevron'
import { selectAvailableCountries, getFlagFromCountryCode, Button, FadeInBox } from './ui_utils';
import classNames from 'classnames/bind';
import { ValueRange } from './value_range';
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { isFeatureAvailableSelector } from '../onboarding';
import { useAccentStyles } from './theme';
import { isLimitedWidthSelector } from '../selectors';

interface SelectProps {
    label: string | JSX.Element;
    height: string;
    onClick: (evt: any) => void;
}

export function Select(props: SelectProps & BoxProps) {
    const chevronSize = '';
    const { onClick, label, ...rest } = props;
    return (
        <Box className={styles.container} onClick={props.onClick} {...rest}>
            <div className={styles.innerContainer} style={{ height: props.height }}>
                {props.label}
                <Chevron className={styles.innerContainerChevron} width='100%' height='60%' />
            </div>
        </Box>
    );
}


// ---

function SelectDialog(props: { title: JSX.Element | string, subtitle?: JSX.Element | string, children?: JSX.Element[] | JSX.Element }) {
    const limitedWidth = isLimitedWidthSelector();
    return (
    <Box display='flex' flexDirection='column' alignItems='stretch'>
            {
                !limitedWidth ?
                    <Box mb={3}>
                        <Typography variant='h2' align='center'>{props.title}</Typography>
                    </Box>
                    : null
            }
            {props.children}
        </Box>
    );
}


// --- Country

function getCountryValueSelector() {
    return useAppSelector(state => {
        const selectedCodes = state.rawData.filterQuery.country_codes
        if (selectedCodes) {
            return selectedCodes[0];
        } else {
            return '';
        }
    });
}

export function CountrySelect(props: BoxProps) {
    const { height, ...rest } = props;
    const dispatch = useAppDispatch()
    const countryValue = getCountryValueSelector();

    const handleClick = () => {
        dispatch(uiSetSelect({ current: 'country' }));
    };
    const flag = countryValue ? (
        <div style={{ 'height': '100%', display: 'inline-block' }}>
            {getFlagFromCountryCode(countryValue, styles.flagSvg)}
        </div>
    ) : null;
    return (
        <Select label={flag} height={height ?? '3rem'} onClick={handleClick} {...rest} />
    );
}

const countryOverlay = () => {
    const dispatch = useAppDispatch()
    const countries = useAppSelector(selectAvailableCountries)

    const handleCountryChange = (code) => {
        dispatch(uiSetSelect({ current: null }));
        dispatch(updateObservationsQuery({ country_codes: [code] }))
    };
    function countryMenuItems(codes: string[]) {
        const items = [];
        codes.sort((a, b) => countryCodeToName[a] < countryCodeToName[b] ? -1 : 1)
        let currentLetter = '';
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            const letter = countryCodeToName[code].charAt(0)
            if (currentLetter != letter) {
                currentLetter = letter;
                items.push(
                    <Box width='100%' mt={4} key={`country-${code}`}>
                        <Typography variant='h2'>{currentLetter.toUpperCase()}</Typography>
                    </Box>
                )
            }
            
            const flag = getFlagFromCountryCode(code, styles.openSelectFlag);
            items.push(
                <div className={styles.openSelectItem} key={code} onClick={() => handleCountryChange(code)}>
                    {flag}
                    <Typography variant='h3'> {countryCodeToName[code]} </Typography>
                </div>
            );

        }
        return items;
    }
    const menuItems = countryMenuItems(countries);
    return (
        <SelectDialog title={'Select a country from the list'}>
            <div className={styles.openSelectGrid}>
                {menuItems}
            </div>
        </SelectDialog>
    )
}


// Value ----

export function ValuesSelect(props: BoxProps & { variant: 'h1' | 'h2' | 'h3', accent?: boolean }) {
    const { height, variant, accent, ...rest } = props;
    const dispatch = useAppDispatch()
    const selectedValue = useAppSelector(state => {
        return state.rawData.valuesQuery.selectedValue;
    });

    const typoCls = accent ? useAccentStyles().accentText : '';

    const label = selectedValue ?
        <Typography variant={variant} className={typoCls}>
            {ValuesMap[selectedValue]}
        </Typography>
        : '...';

    const handleClick = () => {
        dispatch(uiSetSelect({ current: 'value' }));
    };
    return (
        <Select label={label} height={height || '3rem'} onClick={handleClick} {...rest} />
    );
}

export const ValuesView = (props: {
    onSelect?: (v: keyof typeof ValuesMap) => void, 
    onSubmit: (valuesQuery: ValuesQuery) => void }
) => {
    const values = Object.keys(ValuesMap) as (keyof typeof ValuesMap)[];
    const limitedWidth = isLimitedWidthSelector();

    const selectedValue = useAppSelector(state => {
        return state.rawData.valuesQuery.selectedValue;
    });
    const numericValue = useAppSelector(state => {
        return state.rawData.valuesQuery.value;
    });

    // const [uiSelectedValue, setUiSelectedValue] = useState(selectedValue);
    const [uiSelectedValue, setUiSelectedValue] = useState(null);
    const [uiSelectedNumericValue, setUiSelectedNumericValue] = useState(numericValue);

    const handleValueSelect = (value: keyof typeof ValuesMap) => {
        setUiSelectedValue(value);
        setUiSelectedNumericValue(0);
        props.onSelect?.(value);
    };

    const handleNumericValueSet = (value: number) => {
        setUiSelectedNumericValue(value);
    };

    const handleOk = (evt) => {
        props.onSubmit({ selectedValue: uiSelectedValue, value: uiSelectedNumericValue });
    };

    const handlePrev = (evt) => {
        setUiSelectedValue(null)
        props.onSelect?.(null);
    };

    const NextButton = <Button accent label='ok' select={false} onClick={handleOk} />
    const PrevButton = <Button label='< back' select={false} onClick={handlePrev} />

    const rangeText = (
        <Box display='flex' alignItems='middle' flexDirection='column' p={4}>
            <Typography variant='h4'>
                Choose a value from 1 to 10 on the scale, answering the question:
            </Typography>
            <Box mt={2}>
                <Typography variant='h2'>
                    <i>"How much do you tolerate <b>{ValuesMap[uiSelectedValue]}</b> in society?"</i>
                </Typography>
            </Box>
            <Box mt={2} display='flex' flexDirection='row'>
                {limitedWidth ? PrevButton : null}
                {uiSelectedNumericValue > 0 ? NextButton : null}
            </Box>
        </Box>
    );

    const valueButtons = values.map(v => {
        const value = ValuesMap[v];
        const select = uiSelectedValue == v;
        const fadeOut = !select && !!uiSelectedValue;
        const cls = classNames(styles.valuesButtonContainer, { [styles.fadeOutButton]: fadeOut });
        return (
            <Box className={cls} key={v}>
                <Button label={value} select={select} onClick={() => handleValueSelect(v)}> </Button>
            </Box>
        );
    })

    const hideValueButtons = limitedWidth && uiSelectedValue;

    return (
        <Fragment>
            {
                !hideValueButtons ?
                    <Box flex={1} display='flex' flexDirection='column'>
                        {valueButtons}
                    </Box>
                    : null
            }
            <Box display='flex'
                flexDirection={limitedWidth ? 'column' : 'row'}
                ml={!limitedWidth ? 8 : 0}>

                <CSSTransition in={!!uiSelectedValue} timeout={1000} classNames={{
                    enter: styles.enterFade,
                    enterActive: styles.enterActiveFadeWidthDelay,
                }}>
                    <Box 
                        flexBasis={limitedWidth ? undefined : '200px'}
                        // flex={limitedWidth ? 1 : null}
                        height={limitedWidth ? '50vh' : undefined}
                        width={limitedWidth ? '200px' : undefined}
                        margin={limitedWidth ? 'auto' : ''}
                        mt={'10px'}
                        className={styles.fadeHidden} key='key'>
                        {!!uiSelectedValue ? <ValueRange value={uiSelectedNumericValue} onValueSet={handleNumericValueSet} key='value-range' /> : null}
                    </Box>
                </CSSTransition>
                <CSSTransition in={!!uiSelectedValue} timeout={1000} classNames={{
                    enter: styles.enterFade,
                    enterActive: styles.enterActiveFadeWidthDelay,
                }}>
                    <Box flex={1} position='relative' className={styles.fadeHidden} key='key'>
                        {!!uiSelectedValue ? rangeText : null}
                    </Box>
                </CSSTransition>
            </Box>
        </Fragment>
    );
}

const valueOverlay = () => {
    const dispatch = useAppDispatch();
    const limitedWidth = isLimitedWidthSelector();

    const onSubmit = (query: ValuesQuery) => {
        dispatch(updateValuesQuery(query));
        dispatch(uiSetSelect({ current: null }));
    }

    return (
        <SelectDialog title={'Select a value from the list'} subtitle='list is ordered by....'>
            <Box display='flex' flexDirection='row' width={limitedWidth ? '100%' : '700px'} height={limitedWidth ? '100%' : null} mt={2}>
                <ValuesView onSubmit={onSubmit} />
            </Box>
        </SelectDialog>
    );
}



// Demographic Select 
type Axis = 'x' | 'y';

function getDemoSelector(axis: Axis) {
    return useAppSelector(state => {
        if (axis == 'x') {
            return state.rawData.primaryFilterDemographic;
        } else {
            return state.rawData.secondaryFilterDemographic;
        }
    });
}

export function DemographicSelect(props: BoxProps & { axis: Axis, variant: 'h1' | 'h2' | 'h3' | 'h4', accent?: boolean }) {
    const { axis, variant, accent, height, ...rest } = props;
    const dispatch = useAppDispatch()
    const selectedDemographic = getDemoSelector(axis);
    const typoCls = accent ? useAccentStyles().accentText : '';
    const label = selectedDemographic ?
        <Typography variant={variant} className={typoCls}>
            {getReadableDescriptionForDemographic(selectedDemographic)}
        </Typography>
        : '...';

    const handleClick = () => {
        dispatch(uiSetSelect({ current: 'demographic', params: { axis } }));
    };

    return (
        <Select label={label} height={height ?? '3rem'} onClick={handleClick} {...rest} />
    );
}

export const DemographicView = (props: { axis: Axis, onSubmit: (demo: ObservationDemographics | null) => void }) => {
    const axis = props.axis;
    const selectedDemographic = getDemoSelector(axis);
    const otherDemographic = getDemoSelector(axis == 'x' ? 'y' : 'x');

    const [uiSelectedDemo, setUiSelectedDemo] = useState(selectedDemographic);

    const isFeatureRemoveButtonAvailable = useAppSelector(isFeatureAvailableSelector('remove_demographic_button'));

    const handleDemoSelect = (demo: ObservationDemographics) => {
        setUiSelectedDemo(demo);
        setTimeout(() => {
            props.onSubmit(demo);
        }, 600);
        // if (demo == null) {
        //     // remove filter
        //     props.onSubmit(null);
        // } else {
        //     setUiSelectedDemo(demo);
        // }
    };

    // const handleOk = (evt) => {
    //     props.onSubmit(uiSelectedDemo);
    // };

    // const NextButton = <Button accent label='ok' select={false} onClick={handleOk} />

    // const demoText = (
    //     <Box display='flex' alignItems='middle' flexDirection='column' p={4}>
    //         {/* <Typography variant='h4'>
    //             We will display here some info about the demographic you selected.
    //             Did you know that <b>{uiSelectedDemo}</b> ... bla bla bla ... in society"
    //         </Typography> */}
    //         <Box mt={2}>
    //             {!!uiSelectedDemo ? NextButton : null}
    //         </Box>
    //     </Box>
    // );

    const demoButtons = [];

    demoButtons.push(...ObservationDemographicsList.map((v: ObservationDemographics) => {
        const label = getReadableDescriptionForDemographic(v);
        const select = uiSelectedDemo == v;
        const fadeOut = !select && !!uiSelectedDemo;
        const cls = classNames(styles.valuesButtonContainer, { [styles.fadeOutButton]: fadeOut });
        const removeDemo = otherDemographic == v;
        return (
            <Box className={cls} key={v} hidden={removeDemo}>
                <Button label={label} select={select} onClick={() => handleDemoSelect(v)}> </Button>
            </Box>
        );
    }));

    if (isFeatureRemoveButtonAvailable) {
        // add remove demographic button
        demoButtons.push((
            <Box className={styles.valuesButtonContainer} key={'no-filter'} mt={2}>
                <Button label={'Remove all filters'} select={false} onClick={() => handleDemoSelect(null)}> </Button>
            </Box>
        ));
    }

    return (
        <Fragment>
            <Box flex={1} display='flex' flexDirection='column'>
                {demoButtons}
            </Box>
            {/* <FadeInBox visible={!!uiSelectedDemo} flex={1} display='flex' flexDirection='column' justifyContent='flex-end'>
                {demoText}
            </FadeInBox> */}
        </Fragment>
    )
}

const demographicOverlay = (props: { axis: Axis }) => {
    const axis = props.axis;
    const dispatch = useAppDispatch();
    const limitedWidth = isLimitedWidthSelector();
    const selectedDemographic = getDemoSelector(props.axis);
    const xDemographic = getDemoSelector('x');

    const dispatchDemo = (demo: ObservationDemographics | null) => {
        if (demo == null) {
            dispatch(setSecondaryFilterDemographic({ demographic: null }));
            dispatch(setPrimaryFilterDemographic({ demographic: null }));
        } else if (axis == 'x' || xDemographic == null) {
            dispatch(setPrimaryFilterDemographic({ demographic: demo }));
        } else if (axis == 'y') {
            dispatch(setSecondaryFilterDemographic({ demographic: demo }));
        }
    }

    const handleOnSubmit = (demo: ObservationDemographics | null) => {
        dispatchDemo(demo);
        dispatch(uiSetSelect({ current: null }));
    }

    return (
        <SelectDialog title={'Select a demographic from the list'} subtitle='list is ordered by....'>
            <Box display='flex' flexDirection='row' width={limitedWidth ? '100%' : '700px'} mt={2}>
                <DemographicView onSubmit={handleOnSubmit} axis={axis} />
            </Box>
        </SelectDialog>
    );
}

// ----------
export const SelectOverlays = {
    'country': countryOverlay,
    'value': valueOverlay,
    'demographic': demographicOverlay,
}

