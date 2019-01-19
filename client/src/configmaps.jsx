import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Moment from 'react-moment';
import Fab from '@material-ui/core/Fab';
import BuildIcon from '@material-ui/icons/Build';
import Tooltip from '@material-ui/core/Tooltip';
import Editor from './editor';
import MaterialTable from 'material-table';
import SimpleList from './simpleList';

import { connect } from 'react-redux';

import axios from 'axios';

const styles = theme => ({
    root: {
        width: '100%',
        overflowX: 'auto'
    },
    table: {
        minWidth: 700
    },
    title: {
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2
    }
});

const mapStateToProps = ({ currentNs, currentContext }) => ({
    currentNs,
    currentContext
});

class ConfigMaps extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            configmaps: [],
            editor: {
                open: false,
                content: {}
            }
        };
        this.fetchConfigMaps = this.fetchConfigMaps.bind(this);
    }

    componentDidMount() {
        this.fetchConfigMaps();
    }

    componentDidUpdate(prevProps) {
        const { currentNs, currentContext } = this.props;
        const { currentNs: prevNs, currentContext: prevContext } = prevProps;

        if (currentNs !== prevNs || currentContext !== prevContext) {
            this.fetchConfigMaps();
        }
    }

    fetchConfigMaps() {
        const { currentContext, currentNs } = this.props;

        axios
            .get(`/api/namespace/${currentNs}/configmaps`, {
                headers: {
                    'k8s-context': currentContext
                }
            })
            .then(res => {
                this.setState({ configmaps: res.data.body.items });
            });
    }

    edit(configMap) {
        const { currentNs } = this.props;
        this.setState({
            editor: {
                open: true,
                content: configMap,
                editUrl: `/api/namespace/${currentNs}/configmaps/${configMap.metadata.name}`
            }
        });
    }

    actions(configMap) {
        return (
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <Tooltip title="Edit" placement="top">
                    <Fab
                        size="small"
                        color="primary"
                        onClick={() => this.edit(configMap)}>
                        <BuildIcon />
                    </Fab>
                </Tooltip>
            </div>
        );
    }

    render() {
        const { classes, currentContext } = this.props;
        const { configmaps, editor } = this.state;

        return (
            <div style={{ maxWidth: '100%' }}>
                <MaterialTable
                    columns={[
                        { title: 'Name', render: rowData => rowData.metadata.name },
                        { title: 'Values', render: rowData => (<SimpleList data={rowData.data} />) },
                        { title: 'Created', render: rowData => (<Moment fromNow>{rowData.metadata.creationTimestamp}</Moment>) },
                        { title: 'Actions', render: rowData => this.actions(rowData)},
                    ]}
                    data={configmaps}
                    title='Config Maps'
                    options={{paging: false, search: false, sorting: false}}
                />
                <Editor
                    context={currentContext}
                    content={editor.content}
                    editUrl={editor.editUrl}
                    open={editor.open}
                    onClose={() =>
                        this.setState({
                            editor: {
                                open: false
                            }
                        })
                    }
                />
            </div>
        );
    }
}

ConfigMaps.propTypes = {
    classes: PropTypes.object.isRequired,
    currentContext: PropTypes.string,
    currentNs: PropTypes.string.isRequired
};

export default connect(mapStateToProps)(withStyles(styles)(ConfigMaps));
