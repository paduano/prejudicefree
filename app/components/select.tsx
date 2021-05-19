
import { Box, BoxProps, Typography } from '@material-ui/core'
import React, { Fragment, useState } from 'react';
import styles from '../../styles/select.module.css'
import { countryCodeToName } from '../data/countries';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, ObservationDemographics, ObservationDemographicsList, ValuesMap } from '../observation';
import { setPrimaryFilterDemographic, setSecondaryFilterDemographic, uiSetSelect, updateObservationsQuery, updateValuesQuery } from '../store';
import { Chevron } from './chevron'
import { selectAvailableCountries, getFlagFromCountryCode } from './ui_utils';
import classNames from 'classnames/bind';
import { ValueRange } from './value_range';
import { CSSTransition, TransitionGroup } from 'react-transition-group'

interface SelectProps {
    label: string | JSX.Element;
    height: string;
    onClick: () => void;
}

export function Select(props: SelectProps) {
    const chevronSize = '';
    return (
        <div className={styles.container} onClick={props.onClick} >
            <div className={styles.innerContainer} style={{ height: props.height }}>
                {props.label}
                <Chevron className={styles.innerContainerChevron} width='100%' height='60%' />
            </div>
        </div>
    );
}

// UTILS
function FadeInBox(props: BoxProps & {visible: boolean}) {
    const { visible, className, children, ...rest} = props;
    const cls = classNames(className, styles.fadeHidden);
    return (
        <CSSTransition in={visible} timeout={1000} classNames={{
            enter: styles.enterFade,
            enterActive: styles.enterActiveFadeWidthDelay,
        }}>
            <Box {...rest} className={cls} key='key'>
                {visible ? children : null}
            </Box>
        </CSSTransition>
    )
}

// ---

function SelectDialog(props: { title: JSX.Element | string, subtitle?: JSX.Element | string, children?: JSX.Element[] | JSX.Element }) {
    return (
        <Box display='flex' flexDirection='column'>
            <Box mb={3}>
                <Typography variant='h2' align='center'>{props.title}</Typography>
            </Box>
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

export function CountrySelect() {
    const dispatch = useAppDispatch()
    const countryValue = getCountryValueSelector();

    const handleClick = () => {
        dispatch(uiSetSelect({ current: 'country' }));
    };
    const flag = countryValue ? (
        getFlagFromCountryCode(countryValue, styles.flagSvg)
    ) : null;
    return (
        <Select label={flag} height='3rem' onClick={handleClick} />
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
        return codes.map(code => {
            const flag = getFlagFromCountryCode(code, styles.openSelectFlag);
            return (
                <div className={styles.openSelectItem} key={code} onClick={() => handleCountryChange(code)}>
                    {flag}
                    <Typography variant='h3'> {countryCodeToName[code]} </Typography>
                </div>
            )
        })
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

export function ValuesSelect() {
    const dispatch = useAppDispatch()
    const selectedValue = useAppSelector(state => {
        return state.rawData.valuesQuery.selectedValue;
    });

    const label = selectedValue ? ValuesMap[selectedValue] : '...';

    const handleClick = () => {
        dispatch(uiSetSelect({ current: 'value' }));
    };
    return (
        <Select label={label} height='3rem' onClick={handleClick} />
    );
}

const Button = (props: { label: string, select: boolean, className?: string, onClick: (evt: any) => void } & React.ButtonHTMLAttributes<{}>) => {
    const { label, children, className, select, ...rest } = props;
    const [white, setWhite] = useState(false);

    const cls = classNames(styles.buttonContainer, props.className ?? '');
    const clsWhite = classNames(styles.buttonWhite, { [styles.buttonWhiteVisible]: white || select });
    const onMouseDown = () => {
        setWhite(true);
    };
    const dismissHover = () => {
        setWhite(false);
    }
    return (
        <div className={cls} onClick={props.onClick} {...rest} onMouseDown={onMouseDown} onMouseUp={dismissHover} onMouseLeave={dismissHover} >
            <div className={styles.buttonInnerContainer}>
                <div className={styles.buttonUnderlineContainer} />
                <div className={styles.buttonUnderlineCover} />
                <div className={clsWhite}>
                    <Typography variant='h3'>
                        {label}
                    </Typography>
                </div>
                <Typography variant='h3'>
                    {label}
                </Typography>
            </div>
        </div>
    );
}

const valueOverlay = () => {
    const dispatch = useAppDispatch();
    const values = Object.keys(ValuesMap) as (keyof typeof ValuesMap)[];

    const selectedValue = useAppSelector(state => {
        return state.rawData.valuesQuery.selectedValue;
    });
    const numericValue = useAppSelector(state => {
        return state.rawData.valuesQuery.value;
    });

    const [uiSelectedValue, setUiSelectedValue] = useState(selectedValue);
    const [uiSelectedNumericValue, setUiSelectedNumericValue] = useState(numericValue);

    const handleValueSelect = (value: keyof typeof ValuesMap) => {
        setUiSelectedValue(value);
        setUiSelectedNumericValue(0);
    };

    const handleNumericValueSet = (value: number) => {
        setUiSelectedNumericValue(value);
    };

    const handleOk = (evt) => {
        dispatch(updateValuesQuery({ selectedValue: uiSelectedValue, value: uiSelectedNumericValue }));
        dispatch(uiSetSelect({ current: null }));
    };

    const NextButton = <Button label='ok' select={false} onClick={handleOk} />

    const rangeText = (
        <Box display='flex' alignItems='middle' flexDirection='column' p={4}>
            <Typography variant='h4'>
                Select a value from 1 to 10 on the scale, answering the question:
                "How much do you tolerate <b>{ValuesMap[uiSelectedValue]}</b> in society?"
            </Typography>
            <Box mt={2}>
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
    return (
        <SelectDialog title={'Select a value from the list'} subtitle='list is ordered by....'>
            <Box display='flex' flexDirection='row' width='700px' mt={2}>
                <Box flex={1} display='flex' flexDirection='column'>
                    {valueButtons}
                </Box>
                <CSSTransition in={!!uiSelectedValue} timeout={1000} classNames={{
                    enter: styles.enterFade,
                    enterActive: styles.enterActiveFadeWidthDelay,
                }}>
                    <Box flexBasis='120px' mt={'10px'} className={styles.fadeHidden} key='key'>
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

export function DemographicSelect(props: { axis: Axis }) {
    const axis = props.axis;
    const dispatch = useAppDispatch()
    const selectedDemographic = getDemoSelector(axis);
    const label = selectedDemographic ?? '...';

    const handleClick = () => {
        dispatch(uiSetSelect({ current: 'demographic', params: { axis } }));
    };

    return (
        <Select label={label} height='3rem' onClick={handleClick} />
    );
}

const demographicOverlay = (props: { axis: Axis }) => {
    const axis = props.axis;
    const dispatch = useAppDispatch();
    const selectedDemographic = getDemoSelector(props.axis);

    const [uiSelectedDemo, setUiSelectedDemo] = useState(selectedDemographic);

    const dispatchDemo = (demo: ObservationDemographics | null) => {
        if (axis == 'x') {
            dispatch(setPrimaryFilterDemographic({ demographic: demo }));
        } else {
            dispatch(setSecondaryFilterDemographic({ demographic: demo }));
        }
    }

    const handleDemoSelect = (demo: ObservationDemographics) => {
        if (demo == null) {
            // remove filter
            dispatchDemo(null);
            dispatch(uiSetSelect({ current: null }));
        } else {
            setUiSelectedDemo(demo);
        }
    };

    const handleOk = (evt) => {
        dispatchDemo(uiSelectedDemo);
        dispatch(uiSetSelect({ current: null }));
    };

    const NextButton = <Button label='ok' select={false} onClick={handleOk} />

    const demoText = (
        <Box display='flex' alignItems='middle' flexDirection='column' p={4}>
            <Typography variant='h4'>
                We will display here some info about the demographic you selected. 
                Did you know that <b>{uiSelectedDemo}</b> ... bla bla bla ... in society"
            </Typography>
            <Box mt={2}>
                {!!uiSelectedDemo ? NextButton : null}
            </Box>
        </Box>
    );

    const demoButtons = [];

    demoButtons.push(...ObservationDemographicsList.map((v: ObservationDemographics) => {
        const label = getReadableDescriptionForDemographic(v);
        const select = uiSelectedDemo == v;
        const fadeOut = !select && !!uiSelectedDemo;
        const cls = classNames(styles.valuesButtonContainer, { [styles.fadeOutButton]: fadeOut });
        return (
            <Box className={cls} key={v}>
                <Button label={label} select={select} onClick={() => handleDemoSelect(v)}> </Button>
            </Box>
        );
    }));

    // add remove demographic button
    demoButtons.push((
        <Box className={styles.valuesButtonContainer} key={'no-filter'} mt={2}>
            <Button label={'Remove filter'} select={false} onClick={() => handleDemoSelect(null)}> </Button>
        </Box>
    ));

    return (
        <SelectDialog title={'Select a demographic from the list'} subtitle='list is ordered by....'>
            <Box display='flex' flexDirection='row' width='700px' mt={2}>
                <Box flex={1} display='flex' flexDirection='column'>
                    {demoButtons}
                </Box>
                <FadeInBox visible={!!uiSelectedDemo} flex={1} display='flex' flexDirection='column'>
                    {demoText}
                </FadeInBox>
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

